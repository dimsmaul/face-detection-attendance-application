"use client";

import { callAlert } from "@/components/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import unauth from "@/config/unauth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function SignUp() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => SignUpRequest(data),
    onSuccess: () => {
      callAlert({
        title: "Success",
        message: "Sign up successful",
        type: "success",
        onConfirm: () => router.push("/"),
      });
      form.reset();
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="flex justify-center items-center h-screen w-screen overflow-hidden">
      <img src="/assets/img/auth.jpg" alt="" className="w-1/2" />
      <div className="w-1/2 p-20">
        <h1 className="text-5xl font-bold mb-8">Sign Up</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Input name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Input confirm password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
              <div>
                <span className="text-sm">
                  Already have an account?{" "}
                  <Link
                    href={"/"}
                    className="text-sm hover:underline font-bold"
                  >
                    Sign In
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

const SignUpRequest = (body: z.infer<typeof formSchema>) => {
  const data = unauth.post("/auth/sign-up", body);
  return data;
};

const formSchema = z
  .object({
    name: z.string("Required").min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email address"),
    password: z
      .string("Required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string("Required")
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });
