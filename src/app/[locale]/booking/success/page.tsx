"use client";

import { Link } from "@/i18n/routing";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function BookingSuccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Rezervare Confirmată!
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Plata a fost procesată cu succes. Vei primi un email de confirmare cu
          toate detaliile rezervării tale.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/client"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 font-medium text-white hover:bg-primary-600"
          >
            Vezi Rezervările Mele
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Înapoi Acasă
          </Link>
        </div>
      </div>
    </div>
  );
}
