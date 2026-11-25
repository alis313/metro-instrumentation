"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Calendar } from "lucide-react";

interface LayoutImageViewProps {
  layoutImagePath: string | null | undefined;
  layoutImageUploadedAt: string | null | undefined;
  stationName: string;
  isAdmin: boolean;
}

export function LayoutImageView({
  layoutImagePath,
  layoutImageUploadedAt,
  stationName,
  isAdmin,
}: LayoutImageViewProps) {
  if (!layoutImagePath) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-semibold">تصویر جانمایی موجود نیست</p>
          <p className="mt-1 text-sm text-muted-foreground">
            برای ایستگاه {stationName} هنوز تصویر جانمایی ابزارها آپلود نشده است.
          </p>
          {isAdmin && (
            <a
              href="/admin/stations"
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              آپلود تصویر جانمایی
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">تصویر جانمایی ابزارهای دقیق — {stationName}</h3>
          </div>
          {layoutImageUploadedAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>آپلود: {new Date(layoutImageUploadedAt).toLocaleDateString("fa-IR")}</span>
            </div>
          )}
        </div>
        <div className="overflow-hidden rounded-md border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={layoutImagePath}
            alt={`جانمایی ابزارهای ایستگاه ${stationName}`}
            className="w-full"
            style={{ maxHeight: "70vh", objectFit: "contain" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
