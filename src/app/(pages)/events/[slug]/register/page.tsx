import DynamicRegistrationForm from "@/components/DynamicRegistrationForm";
import type { DynamicEvent, DynamicFormSchema } from "@/components/DynamicRegistrationForm";

export const dynamic = "force-dynamic";

const DEFAULT_FORM_FIELDS: DynamicFormSchema["fields"] = [
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
];

async function getEventRegistrationData(slug: string): Promise<{
  event: DynamicEvent | null;
  formSchema: DynamicFormSchema | null;
  upiId: string | null;
  qrCodeUrl?: string | null;
  eventTitle?: string;
  isClosed?: boolean;
}> {
  const { connectToDatabase } = await import("@/lib/mongodb");
  const { default: EventModel } = await import("@/models/EventModel");
  const { getSettings } = await import("@/server/services/settingsService");

  await connectToDatabase();

  const raw = await EventModel.findOne({
    slug: slug.toLowerCase(),
    status: "published",
  })
    .populate("registration.formSchemaId")
    .lean();

  if (!raw) return { event: null, formSchema: null, upiId: null };

  const now = new Date();
  const isEnabled = raw.registration?.enabled ?? false;
  const opensAt = raw.registration?.opensAt ? new Date(raw.registration.opensAt) : null;
  const closesAt = raw.registration?.closesAt ? new Date(raw.registration.closesAt) : null;

  if (!isEnabled || (opensAt && now < opensAt) || (closesAt && now > closesAt)) {
    return { event: null, formSchema: null, upiId: null, eventTitle: raw.title, isClosed: true };
  }

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
    : { id: "default-schema", name: `${raw.title} Registration Form`, fields: DEFAULT_FORM_FIELDS };

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

  return { event, formSchema, upiId, qrCodeUrl, eventTitle: raw.title };
}

export default async function EventRegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { event, formSchema, upiId, qrCodeUrl, eventTitle, isClosed } = await getEventRegistrationData(slug);

  if (isClosed || !event || !formSchema) {
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
            <p className="text-white/70 max-w-2xl mx-auto text-lg font-sans mb-6">
              {eventTitle
                ? `Registrations for ${eventTitle} are currently closed or not active at the moment.`
                : "Registrations are not open for this event."}
            </p>
            <a
              href={`/events/${slug}`}
              className="inline-block px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all"
            >
              ← Return to Event Details
            </a>
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
