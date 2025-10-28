import os
import sys
import atexit
import signal
import subprocess
import threading

from frontend import app

# def _stream_output(prefix: str, stream):
#     """Stream child process output to this process stdout with a prefix."""
#     try:
#         for line in iter(stream.readline, ''):
#             if not line:
#                 break
#             sys.stdout.write(f"[{prefix}] {line}")
#     finally:
#         try:
#             stream.close()
#         except Exception:
#             pass


# def start_node_backend():
#     """Start the Node.js backend (backend/server.js) and return the Popen process.

#     Assumes Node dependencies are installed in ./backend (npm install).
#     """
#     backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
#     node_cmd = ['node', 'server.js']

#     # Platform-specific process group handling for clean shutdown
#     popen_kwargs = {
#         'cwd': backend_dir,
#         'stdout': subprocess.PIPE,
#         'stderr': subprocess.STDOUT,
#         'text': True,
#         'bufsize': 1,
#     }

#     if os.name == 'posix':
#         popen_kwargs['preexec_fn'] = os.setsid  # new process group
#     else:
#         popen_kwargs['creationflags'] = subprocess.CREATE_NEW_PROCESS_GROUP  # type: ignore[attr-defined]

#     proc = subprocess.Popen(node_cmd, **popen_kwargs)

#     # Stream logs in a background thread
#     t = threading.Thread(target=_stream_output, args=('node', proc.stdout), daemon=True)
#     t.start()

#     def _cleanup():
#         try:
#             if proc.poll() is None:
#                 if os.name == 'posix':
#                     os.killpg(proc.pid, signal.SIGTERM)
#                 else:
#                     proc.terminate()
#         except Exception:
#             pass

#     atexit.register(_cleanup)
#     return proc


if __name__ == '__main__':
    # 1) Start Node backend in background
    # node_proc = start_node_backend()
    # print(f"Started Node backend (pid={node_proc.pid}) on http://localhost:3000")

    # 2) Start Flask app (frontend)
    app.run(host="0.0.0.0", port=5001)