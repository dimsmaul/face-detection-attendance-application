"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import z from "zod";
import PresenceForm from "./presence/camera";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import auth from "@/config/auth";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { Label } from "@/components/ui/label";
import { presenceFormSchema } from "./validation";

const Presence = () => {
  const { users } = useAuthStore();
  const [presence, setPresence] = useState<PresenceTypes | null>(null);
  const [openPresence, setOpenPresence] = useState<{
    open: boolean;
    data: z.infer<typeof presenceFormSchema> | null;
  }>({
    open: false,
    data: null,
  });
  const { data } = useQuery({
    queryKey: ["presence-condition"],
    queryFn: () => presenceGetCondition(users.user?.id || ""),
    // enabled: openPresence.open,
  });

  const form = useForm<z.infer<typeof presenceFormSchema>>({
    resolver: zodResolver(presenceFormSchema),
    defaultValues: {
      date: dayjs().format("YYYY-MM-DD"),
      time: dayjs().format("HH:mm"),
      note: "",
      type: "clock-in",
    },
  });

  useEffect(() => {
    if (data?.data && data?.data.length > 0) {
      setPresence(data?.data[0]);
      form.setValue(
        "type",
        data?.data[0].type === 0 ? "clock-out" : "clock-in"
      );
    }
  }, [data]);

  const handleSubmit = (data: z.infer<typeof presenceFormSchema>) => {
    setOpenPresence({ open: true, data });
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardContent>
              <div className="flex flex-row item-center gap-4 mb-4">
                {presence?.type === 0 && (
                  <div className="w-1/2 grid grid-cols-2 gap-2 ">
                    <div className="grid gap-2">
                      <Label>Date</Label>
                      <Input value={presence?.date} disabled />
                    </div>
                    <div className="grid gap-2">
                      <Label>Time</Label>
                      <Input
                        value={dayjs(
                          presence?.date + "T" + presence?.time
                        ).format("HH:mm")}
                        disabled
                      />
                    </div>
                    <div className="col-span-2 grid gap-2">
                      <Label>Note</Label>
                      <Textarea
                        value={presence?.note}
                        disabled
                        className="min-h-40"
                      />
                    </div>
                  </div>
                )}
                <div className="w-1/2 grid grid-cols-2 gap-2">
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-40"
                              placeholder="Input Note"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end items-center gap-2">
                <Button variant={"destructive"} type="button">
                  Permit
                </Button>
                <Button>
                  {presence?.type === 0 ? "Clock Out" : "Clock In"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
      <PresenceForm
        open={openPresence.open}
        onOpenChange={() => {
          setOpenPresence({ open: false, data: null });
        }}
        data={openPresence.data}
        resetForm={() => form.reset()}
      />
    </div>
  );
};

export default Presence;


const presenceGetCondition = async (id: string) => {
  const data = await auth.get("/presence", {
    params: {
      userId: id,
    },
  });
  return data.data;
};

interface PresenceTypes {
  id: string;
  userId: string;
  date: string;
  time: string;
  type: number;
  status: number;
  note: string;
  permitAttachment: null;
  permitReason: null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
}
