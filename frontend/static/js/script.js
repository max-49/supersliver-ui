// SuperSliver UI custom scripts
$(function(){
	// Prevent row-click when interacting with inputs/buttons inside the row
	$(document).on('click', 'td.select-cell input[type="checkbox"]', function(e){
		e.stopPropagation();
	});

	// Row click: open placeholder actions modal
	$('tbody').on('click', 'tr[data-session-id]', function(e){
		// Ignore clicks originating from interactive elements
		if ($(e.target).is('input,button,label,code,span.glyphicon')) return;

		var sid = $(this).data('session-id');
		$('#modalSid').text(sid);
		$('#sessionModal').modal('show');
	});

	// Selection handling
	function updateToolbarState(){
		var count = $('.row-select:checked').length;
		$('#btnExecSelected').prop('disabled', count === 0);
	}

	$('#selectAll').on('change', function(){
		var checked = $(this).is(':checked');
		$('.row-select').prop('checked', checked);
		updateToolbarState();
	});

	$(document).on('change', '.row-select', function(){
		// Keep selectAll in sync
		var total = $('.row-select').length;
		var selected = $('.row-select:checked').length;
		$('#selectAll').prop('checked', total > 0 && selected === total);
		updateToolbarState();
	});

	// Sorting
	var sortState = { col: null, dir: 'asc' }; // dir: 'asc' | 'desc'

	function compareValues(a, b, dir){
		// Case-insensitive string compare, fallback to numeric if both are numbers
		var numA = parseFloat(a); var numB = parseFloat(b);
		var bothNumeric = !isNaN(numA) && !isNaN(numB);
		if (bothNumeric){
			return dir === 'asc' ? (numA - numB) : (numB - numA);
		}
		a = (a || '').toString().toLowerCase();
		b = (b || '').toString().toLowerCase();
		if (a < b) return dir === 'asc' ? -1 : 1;
		if (a > b) return dir === 'asc' ? 1 : -1;
		return 0;
	}

	function setSortIndicator($th, dir){
		$('.sort-indicator').text('');
		$th.find('.sort-indicator').text(dir === 'asc' ? '▲' : '▼');
	}

	$('th.sortable').on('click', function(){
		var $th = $(this);
		var col = $th.data('col');
		var dir = (sortState.col === col && sortState.dir === 'asc') ? 'desc' : 'asc';
		sortState = { col: col, dir: dir };

		// Determine column index mapping
		var colIndexMap = { name: 1, sid: 2, hostname: 3, os: 4, arch: 5 };
		var idx = colIndexMap[col];

		var $tbody = $('table.session-table tbody');
		var $rows = $tbody.find('tr').get();

		$rows.sort(function(rowA, rowB){
			var $a = $(rowA).children().eq(idx);
			var $b = $(rowB).children().eq(idx);
			var va = $a.attr('data-sort') || $a.text().trim();
			var vb = $b.attr('data-sort') || $b.text().trim();
			return compareValues(va, vb, dir);
		});

		// Re-append in sorted order
		$.each($rows, function(_, row){ $tbody.append(row); });
		setSortIndicator($th, dir);
	});

	// Execute on Selected
	$('#btnExecSelected').on('click', function(){
		var ids = $('.row-select:checked').map(function(){ return $(this).val(); }).get();
		$('#selectedCount').text(ids.length + ' session(s) selected');
		$('#commandInput').val('');
		$('#execModal').modal('show');
		setTimeout(function(){ $('#commandInput').focus(); }, 200);
	});

		$('#confirmExecBtn').on('click', function(){
			var cmd = ($('#commandInput').val() || '').trim();
			var ids = $('.row-select:checked').map(function(){ return $(this).val(); }).get();
			if (!cmd){ alert('Please enter a command'); return; }
			if (ids.length === 0){ alert('Select at least one session'); return; }

				// Call Flask (server-side proxies to Node backend)
				$.ajax({
					url: '/actions/exec-bulk',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({ cmd: cmd, sessionIds: ids }),
				success: function(resp){
					try {
						var lines = (resp.results || []).map(function(r){
							return (r.success ? '✅' : '❌') + ' ' + r.sid + (r.exitCode !== undefined ? ' (exit ' + r.exitCode + ')' : '') + (r.error ? ' - ' + r.error : '')
						})
						alert('Results:\n' + lines.join('\n'))
					} catch (e){
						alert('Command executed. (Unable to parse results)')
					}
					$('#execModal').modal('hide');
				},
				error: function(xhr){
					alert('Bulk exec failed: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.statusText))
				}
			})
	});

		// Open interactive shell without WebSockets (HTTP polling)
			$(document).on('click', '#openShellBtn', function(){
				var sid = $('#modalSid').text().trim();
				if (!sid){ return; }
				$('#shellSid').text(sid);
				$('#shellModal').modal('show');

				// Initialize terminal
				var term = new window.Terminal({
					cols: 120,
					rows: 24,
					cursorBlink: true,
					theme: { background: '#000000' }
				});
				var $container = $('#terminal');
				$container.empty();
				term.open($container.get(0));

				var sessionId = null;
				var cursor = 0;
				var polling = false;

				function decodeBase64ToUtf8(b64){
					try {
						var bin = atob(b64);
						var bytes = new Uint8Array(bin.length);
						for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
						return new TextDecoder('utf-8').decode(bytes);
					} catch (e){ return ''; }
				}

				function pollOutput(){
					if (!sessionId || !polling) return;
					$.ajax({
						url: '/actions/shell/output',
						method: 'GET',
						data: { sid: sid, sessionId: sessionId, cursor: String(cursor) },
						success: function(resp){
							if (resp && resp.data){
								var text = decodeBase64ToUtf8(resp.data);
								if (text) term.write(text);
								if (typeof resp.nextCursor === 'number') cursor = resp.nextCursor;
							}
							if (resp && resp.closed){ polling = false; term.write('\r\n[Shell closed]\r\n'); return; }
							setTimeout(pollOutput, 150);
						},
						error: function(){ setTimeout(pollOutput, 300); }
					});
				}

				// Start shell session via Flask
				$.ajax({
					url: '/actions/shell/start',
					method: 'POST',
					contentType: 'application/json',
					data: JSON.stringify({ sid: sid }),
					success: function(resp){
						if (!resp || !resp.sessionId){ term.write('\r\n[Shell error: failed to start session]\r\n'); return; }
						sessionId = resp.sessionId;
						polling = true;
						term.focus();
						pollOutput();

						term.onData(function(data){
							if (!sessionId) return;
							$.ajax({
								url: '/actions/shell/input',
								method: 'POST',
								contentType: 'application/json',
								data: JSON.stringify({ sid: sid, sessionId: sessionId, data: data })
							});
						});

						$('#shellModal').one('hidden.bs.modal', function(){
							polling = false;
							if (sessionId){
								$.ajax({ url: '/actions/shell/close', method: 'POST', contentType: 'application/json', data: JSON.stringify({ sid: sid, sessionId: sessionId }) });
							}
							try { term.dispose(); } catch(_){ }
						});
					},
					error: function(){ term.write('\r\n[Shell error: failed to start]\r\n'); }
				});
		});
});
