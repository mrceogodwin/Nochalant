import { redirect } from "next/navigation";
import { verifyPaystack, markPaymentPaid } from "@/lib/payments";

export default async function CallbackPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const reference = (await searchParams).reference;
  if (reference) {
    const paid = await verifyPaystack(reference);
    if (paid) await markPaymentPaid(reference);
  }
  redirect("/wallet");
}
