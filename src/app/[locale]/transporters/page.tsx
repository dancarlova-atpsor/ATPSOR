import { useTranslations } from "next-intl";
import { TransportersList } from "@/components/transporters/TransportersList";

export default function TransportersPage() {
  const t = useTranslations("transporters");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          {t("subtitle")}
        </p>
      </div>
      <TransportersList />
    </div>
  );
}
