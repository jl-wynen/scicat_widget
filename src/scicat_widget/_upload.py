from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ValidationError
from scitacean import PID, Client, Dataset, File, model


def upload_dataset(
    client: Client, widget_data: dict[str, object]
) -> Dataset | UploadError:
    dataset = make_dataset_from_widget_data(widget_data)
    try:
        return client.upload_new_dataset_now(dataset)
    except ValidationError as error:
        return UploadError(
            errors=[
                FieldError(field=err["loc"][0], error=err["msg"])
                for err in error.errors()
            ]
        )
    except ValueError as error:
        if "cannot determine source_folder" in error.args[0].lower():
            return UploadError(
                errors=[FieldError(field="sourceFolder", error="Required")]
            )
        raise


class FieldError(BaseModel, extra="forbid"):
    field: str
    error: str


class UploadError(BaseModel, extra="forbid"):
    errors: list[FieldError]


def make_dataset_from_widget_data(data: dict[str, Any]) -> Dataset:
    """Construct a Scitacean dataset from widget data."""
    converted = _convert_field_names(data)

    converted.update(_convert_owners(data.get("owners", [])))
    converted.update(_convert_pi(data.get("principalInvestigator", {})))
    converted.update(_convert_relationships(converted.pop("relationships", None)))

    [file_meta, files] = _convert_files(data.get("files"))
    converted.update(file_meta)

    # TODO
    _attachments = _convert_attachments(data.get("attachments"))

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


def _convert_relationships(
    relationships: list[dict[str, str]] | None,
) -> dict[str, Any]:
    if not relationships:
        return {}

    converted = [
        model.Relationship(
            relationship=rel.get("relationship"),
            pid=PID.parse(rel.get("dataset", "")),
        )
        for rel in relationships
        if rel.get("relationship", "") != "input"
    ]
    inputs = [
        PID.parse(rel.get("dataset", ""))
        for rel in relationships
        if rel.get("relationship", "") == "input"
    ]

    result = {}
    if inputs:
        result["input_datasets"] = inputs
    if converted:
        result["relationships"] = converted
    return result


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
