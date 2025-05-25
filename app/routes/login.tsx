import { LoginForm } from "~/components/login-form"
import type { Route } from "./+types/login"
import { isAuthenticated } from "utils/auth.service";
import { redirect } from "react-router";

export async function clientLoader({params}: Route.ClientLoaderArgs) {
  console.log("Login page loader called with params:", params);
  const isLoggedIn = await isAuthenticated();
  
  if (isLoggedIn) {
    console.log("User is logged in:", isLoggedIn);
    return redirect("/home");
  }
}
export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gray-900 p-6 md:p-10 ">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm className=""/>
      </div>
    </div>
  )
}
