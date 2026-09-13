import Swal from "sweetalert2";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function showVoteSuccessAlert(
  title: string,
  text: string,
  tip?: string
): Promise<void> {
  const tipHtml =
    tip && tip.trim().length > 0
      ? `<p style="margin:1rem 0 0;padding:0 0.25rem;font-size:0.875rem;line-height:1.5;color:#6b7280;text-align:center;">${escapeHtml(tip)}</p>`
      : "";

  await Swal.fire({
    icon: "success",
    title,
    html: `<p style="margin:0;text-align:center;">${escapeHtml(text)}</p>${tipHtml}`,
    confirmButtonColor: "#5a7a5e",
  });
}

export async function showVoteErrorAlert(
  title: string,
  text: string
): Promise<void> {
  await Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#5a7a5e",
  });
}
