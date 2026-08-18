import { after } from "next/server";
import { revalidatePath } from "next/cache";

/** Revalidate list pages immediately; defer heavier dashboard refresh. */
export function revalidateMutation(paths: string[], deferDashboard = true) {
  const immediate = deferDashboard ? paths.filter((path) => path !== "/dashboard") : paths;
  for (const path of immediate) {
    revalidatePath(path);
  }
  if (deferDashboard && paths.includes("/dashboard")) {
    after(() => {
      revalidatePath("/dashboard");
    });
  }
}
