import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("scicat_widget")
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"

_STATIC_PATH = pathlib.Path(__file__).parent / "_static"


class SearchDropdown(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "search_dropdown.js"
    _css = _STATIC_PATH / "search_dropdown.css"
    options = traitlets.List().tag(sync=True)


class Owners(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "owners.js"
    _css = _STATIC_PATH / "owners.css"
    owners = traitlets.List().tag(sync=True)
    pi = traitlets.Dict().tag(sync=True)


class DatasetWidget(anywidget.AnyWidget):
    _esm = _STATIC_PATH / "dataset_widget.js"
    _css = _STATIC_PATH / "dataset_widget.css"
