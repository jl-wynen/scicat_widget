from typing import Any

from scitacean import Client, Dataset, File


def upload_dataset(client: Client, widget_data: dict[str, object]) -> None:
    dataset = make_dataset_from_widget_data(widget_data)
    print("Converted dataset:", dataset)
    print("Files:", dataset.files)


def make_dataset_from_widget_data(data: dict[str, Any]) -> Dataset:
    """Construct a Scitacean dataset from widget data."""
    converted = _convert_field_names(data)

    converted.update(_convert_owners(data.get("owners", [])))
    converted.update(_convert_pi(data.get("principalInvestigator", {})))

    [file_meta, files] = _convert_files(data.get("files"))
    converted.update(file_meta)

    # TODO
    attachments = _convert_attachments(data.get("attachments"))
    _ = data.get("relationships")

    print("Converted params:", converted)
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
        "source_folder": files.pop("sourceFolder", ""),
        "checksum_algorithm": files.pop("checksumAlgorithm", ""),
    }
    files = [
        File.from_local(spec["localPath"], remote_path=spec.get("remotePath", None))
        for spec in files.get("files", [])
    ]
    return fields, files


def _convert_attachments(attachments: list[dict[str, str]] | None) -> None:
    # TODO implement
    return


def _convert_field_names(widget_data: dict[str, Any]) -> dict[str, Any]:
    converted = {
        field.name: value
        for field in Dataset.fields()
        if (value := widget_data.get(field.scicat_name)) is not None
    }
    # Not handled by Dataset.fields:
    converted["meta"] = widget_data.get("scientificMetadata", {})
    return converted
