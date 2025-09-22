"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import unauth from "@/config/unauth";
import { useAuthStore } from "@/store/useAuthStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function SignIn() {
  const { setUsers } = useAuthStore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => SignInRequest(data),
    onSuccess: (data) => {
      setUsers(data.data.data);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="flex justify-center items-center h-screen w-screen overflow-hidden">
      <img src="/assets/img/auth.jpg" alt="" className="w-1/2" />
      <div className="w-1/2 p-20">
        <h1 className="text-5xl font-bold mb-8">Sign In</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Input email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Input password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      <div className="flex justify-between">
                        <div>
                          <FormMessage />
                        </div>
                        <Link
                          href={"/forgot-password"}
                          className="text-sm hover:underline text-blue-500 dark:text-muted-foreground"
                        >
                          Forgot Password ?
                        </Link>
                      </div>
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
              <div>
                <span className="text-sm">
            Don&apos;t have an account?
                  <Link
                    href={"/sign-up"}
                    className="text-sm hover:underline font-bold"
                  >
                    Sign Up
                  </Link>
                </span>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

const SignInRequest = (body: z.infer<typeof formSchema>) => {
  const data = unauth.post("/auth/sign-in", body);
  return data;
};

const formSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
