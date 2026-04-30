"""Configure Jupyter Lab for UI tests."""
# ruff: noqa: F821

from jupyterlab.galata import configure_jupyter_server

configure_jupyter_server(c)

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"
