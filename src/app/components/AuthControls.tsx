import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2, LogIn, LogOut, ShieldCheck, UserCircle2 } from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  signInWithEmailPassword,
  signOutSupabase,
  signUpWithEmailPassword,
} from "../utils/supabaseAuth";

interface AuthControlsProps {
  session: Session | null;
  isReady: boolean;
}

export function AuthControls({ session, isReady }: AuthControlsProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const handleSignIn = async () => {
    resetFeedback();
    setAuthLoading(true);

    const { error: signInError } = await signInWithEmailPassword(
      email.trim(),
      password
    );

    setAuthLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Signed in successfully.");
    setOpen(false);
    setPassword("");
  };

  const handleSignUp = async () => {
    resetFeedback();
    setAuthLoading(true);

    const { data, error: signUpError } = await signUpWithEmailPassword(
      email.trim(),
      password
    );

    setAuthLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.user && !data.session) {
      setMessage("Check your email to confirm your account.");
      return;
    }

    setMessage("Account created and signed in.");
    setOpen(false);
    setPassword("");
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    const { error: signOutError } = await signOutSupabase();
    setAuthLoading(false);

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setMessage("Signed out.");
  };

  if (!isReady) {
    return (
      <Badge variant="outline" className="border-primary/20 text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Auth
      </Badge>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-primary/20 text-primary max-w-40 truncate">
          <UserCircle2 className="size-3" />
          <span className="truncate">{session.user.email ?? "Signed in"}</span>
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSignOut}
          disabled={authLoading}
          className="border-primary/20 hover:bg-primary/10"
        >
          {authLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          <span className="ml-2 hidden sm:inline">Sign out</span>
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-primary/20 hover:bg-primary/10">
          <LogIn className="size-4 mr-2" />
          Sign in
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Supabase Auth
          </DialogTitle>
          <DialogDescription>
            Sign in or create an account. Use your Supabase project's auth settings for providers and email confirmations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={authLoading}
          />
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={authLoading}
          />

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-md p-2">
              {message}
            </p>
          )}
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
            <Button
              variant="outline"
              onClick={handleSignUp}
              disabled={authLoading || !email.trim() || !password}
            >
              {authLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Create account
            </Button>
            <Button
              onClick={handleSignIn}
              disabled={authLoading || !email.trim() || !password}
              className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
            >
              {authLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Sign in
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
