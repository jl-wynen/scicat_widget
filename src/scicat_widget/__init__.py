import importlib.metadata
from ._widgets import DatasetUploadWidget, dataset_upload_widget

try:
    __version__ = importlib.metadata.version("scicat_widget")
except importlib.metadata.PackageNotFoundError:
    __version__ = "0.0.0"

__all__ = ["DatasetUploadWidget", "dataset_upload_widget"]
