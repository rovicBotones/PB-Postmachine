import { redirect } from "react-router";
import type { Route } from "./+types/_index";

export function clientLoader({
  params,
}: Route.ClientLoaderArgs) {
 
 return redirect("/login");
}
export default function Index() {
    return null; // Render nothing since the loader handles the redirect
}