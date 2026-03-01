import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        className="w-full max-w-md"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            await register(username, displayName || username, password);
            navigate("/");
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-6">
            <h1 className="text-xl font-semibold">Create account</h1>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="register-username">Username</Label>
              <Input
                id="register-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-display-name">Display name</Label>
              <Input
                id="register-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-700">
              Register
            </Button>
            <p className="text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-violet-600 hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
