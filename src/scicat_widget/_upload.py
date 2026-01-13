from typing import Any

from scitacean import Client, Dataset, File


def upload_dataset(client: Client, widget_data: dict[str, object]) -> None:
    dataset = make_dataset_from_widget_data(widget_data)
    print("Uploading", dataset)


def make_dataset_from_widget_data(data: dict[str, Any]) -> Dataset:
    """Construct a Scitacean dataset from widget data."""
    converted = dict(data)
    converted["meta"] = converted.pop("scientific_metadata", {})

    converted.update(_convert_owners(converted.pop("owners", [])))
    converted.update(_convert_pi(converted.pop("pi", {})))

    [file_meta, files] = _convert_files(converted.pop("files"))
    converted.update(file_meta)
    attachments = _convert_attachments(converted.pop("attachments"))

    dataset = Dataset(**converted)
    dataset.add_files(*files)
    return dataset


def _convert_owners(owners: list[dict[str, str]] | None) -> dict[str, str]:
    if not owners:
        return {}

    names = []
    emails = []
    orcids = []
    for owner in owners:
        names.append(owner.get("name", ""))
        emails.append(owner.get("email", ""))
        orcids.append(owner.get("orcid", ""))

    name = ";".join(names)
    email = ";".join(emails)
    orcid = ";".join(orcids)
    return {"owner": name, "owner_email": email, "orcid_of_owner": orcid}


def _convert_pi(pi: dict[str, str] | None) -> dict[str, str]:
    if not pi:
        return {}
    return {
        "principal_investigator": pi.get("name", ""),
        "contact_email": pi.get("email", ""),
    }


def _convert_files(files: dict[str, Any]) -> tuple[dict[str, str], list[File]]:
    fields = {
        "source_folder": files.pop("source_folder", ""),
        "checksum_algorithm": files.pop("checksum_algorithm", ""),
    }
    files = [File.from_local(path) for path in files.get("files", [])]
    return fields, files


def _convert_attachments(attachments: list[dict[str, str]] | None) -> None:
    # TODO implement
    return
