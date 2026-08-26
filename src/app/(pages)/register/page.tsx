import { redirect } from "next/navigation";
import DynamicRegistrationForm from "@/components/DynamicRegistrationForm";
import type { DynamicEvent, DynamicFormSchema } from "@/components/DynamicRegistrationForm";

export const dynamic = "force-dynamic";

async function getActiveEvent(): Promise<{
  slug: string | null;
  event: DynamicEvent | null;
  formSchema: DynamicFormSchema | null;
  upiId: string | null;
  qrCodeUrl?: string | null;
}> {
  const { connectToDatabase } = await import("@/lib/mongodb");
  const { default: EventModel } = await import("@/models/EventModel");
  const { getSettings } = await import("@/server/services/settingsService");

  await connectToDatabase();

  const now = new Date();
  const raw = await EventModel.findOne({
    status: "published",
    "registration.enabled": true,
    $or: [
      { "registration.closesAt": null },
      { "registration.closesAt": { $exists: false } },
      { "registration.closesAt": { $gt: now } },
    ],
  })
    .populate("registration.formSchemaId")
    .lean();

  if (!raw) return { slug: null, event: null, formSchema: null, upiId: null };

  const businessSettings = await getSettings("business");
  const upiId = (businessSettings?.upiId as string) ?? null;
  const qrCodeUrl = (businessSettings?.qrCodeUrl as string) || null;

  const schemaDoc = raw.registration?.formSchemaId as unknown as {
    _id: { toString(): string };
    name: string;
    fields: DynamicFormSchema["fields"];
  } | null;

  const formSchema: DynamicFormSchema = schemaDoc
    ? { id: schemaDoc._id.toString(), name: schemaDoc.name, fields: schemaDoc.fields }
    : {
        id: "default-schema",
        name: `${raw.title} Registration Form`,
        fields: [
          { key: "squadName", label: "Squad / Team Name", type: "text", required: true },
          { key: "domain", label: "Domain / Category", type: "text", required: true },
          { key: "leaderFullName", label: "Team Leader Full Name", type: "text", required: true },
          { key: "leaderEmail", label: "Team Leader Email", type: "email", required: true },
          { key: "leaderPhone", label: "Team Leader Phone Number", type: "phone", required: true },
          { key: "leaderCollege", label: "College / Institute Name", type: "text", required: true },
          { key: "member2FullName", label: "Member 2 Full Name", type: "text", required: false },
          { key: "member2Email", label: "Member 2 Email", type: "email", required: false },
          { key: "member3FullName", label: "Member 3 Full Name", type: "text", required: false },
          { key: "member3Email", label: "Member 3 Email", type: "email", required: false },
        ],
      };

  const event: DynamicEvent = {
    id: raw._id.toString(),
    title: raw.title,
    registration: {
      fee: raw.registration?.fee ?? 0,
      requiresPayment: raw.registration?.requiresPayment ?? false,
      teamConfig: raw.registration?.teamConfig ?? null,
      formSchemaId: schemaDoc ? schemaDoc._id.toString() : null,
    },
  };

  return { slug: raw.slug, event, formSchema, upiId, qrCodeUrl };
}

export default async function RegisterPage() {
  const { slug, event, formSchema, upiId, qrCodeUrl } = await getActiveEvent();

  if (slug) {
    redirect(`/events/${slug}/register`);
  }

  if (!event || !formSchema) {
    return (
      <div className="min-h-full w-full overflow-x-hidden">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-8 sm:p-12 text-center">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4 text-white">
              Registrations{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Closed
              </span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg font-sans">
              Registrations are not open at the moment. Check back soon!
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full overflow-x-hidden">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-36 sm:pt-44 pb-20">
        <DynamicRegistrationForm event={event} formSchema={formSchema} upiId={upiId} qrCodeUrl={qrCodeUrl} />
      </main>
    </div>
  );
}

