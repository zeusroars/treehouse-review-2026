import Swal from "sweetalert2";

export async function showVoteSuccessAlert(
  title: string,
  text: string
): Promise<void> {
  await Swal.fire({
    icon: "success",
    title,
    text,
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
