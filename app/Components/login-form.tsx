import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { singInService } from "utils/auth.service"
import { redirect, useNavigate } from "react-router"
import { toast } from "sonner"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errMessage, setErrMessage] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await singInService(e.target[0].value, e.target[1].value);
    console.log(error);
    if (error) {
      setIsLoading(false);
      setErrMessage(true);
      navigate("/login");
    } 
    
    navigate("/home");
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Peoples Balita account
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  
                </div>
                <Input id="password" type="password" required />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:flex-row" hidden={!errMessage}>
                <span className="text-red-500 text-sm">
                  Invalid email or password
                </span>
              </div>
              <Button type="submit" className="w-full">
                {isLoading ? 'Loging in...' : 'Login'}
              </Button>
             
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="../public/logo.png"
              alt="Image"
              className="absolute inset-0  object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Powered by <a href="https://github.com/rovicBotones" target="_blank">Rovic Botones</a> <a href="#"></a>
      </div>
    </div>
  )
}
