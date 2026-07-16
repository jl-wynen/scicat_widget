from scitacean import Client

from scicat_widget import DatasetUploadWidget


def test_can_create_dataset_upload_widget() -> None:
    client = Client.without_login("staging.ess")
    _ = DatasetUploadWidget(client)
