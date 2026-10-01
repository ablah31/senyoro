"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Check, MessageCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  formatWhatsAppNumber,
  NAME_PLACEHOLDER,
  personalizeMessage,
  whatsAppUrl,
  type WhatsAppRecipient,
} from "@/lib/whatsapp";

type Campaign = {
  message: string;
  contacted: string[];
};

const STORAGE_KEY = "senyoro:whatsapp-campaign:v1";
const listeners = new Set<() => void>();
let storedCampaign: string | null | undefined;

function readStoredCampaign() {
  if (storedCampaign !== undefined) return storedCampaign;
  try {
    storedCampaign = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storedCampaign = null;
  }
  return storedCampaign;
}

function getServerCampaign() {
  return null;
}

function subscribeToCampaign(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    storedCampaign = event.newValue;
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveCampaign(campaign: Campaign) {
  storedCampaign = JSON.stringify(campaign);
  try {
    window.localStorage.setItem(STORAGE_KEY, storedCampaign);
  } catch {
    // Stockage indisponible (navigation privée, quota) : le suivi reste en mémoire pour cet onglet.
  }
  listeners.forEach((listener) => listener());
}

function parseCampaign(raw: string | null, defaultMessage: string): Campaign {
  if (!raw) return { message: defaultMessage, contacted: [] };
  try {
    const value = JSON.parse(raw) as Partial<Campaign> | null;
    return {
      message: typeof value?.message === "string" ? value.message : defaultMessage,
      contacted: Array.isArray(value?.contacted)
        ? value.contacted.filter((number) => typeof number === "string")
        : [],
    };
  } catch {
    return { message: defaultMessage, contacted: [] };
  }
}

function recipientLabel(recipient: WhatsAppRecipient) {
  return recipient.name ?? formatWhatsAppNumber(recipient.number);
}

type WhatsAppButtonProps = {
  recipient: WhatsAppRecipient;
  message: string;
  onSend: (number: string) => void;
  variant?: "default" | "outline";
  className?: string;
  accessibleLabel?: string;
  children: ReactNode;
};

function WhatsAppButton({
  recipient,
  message,
  onSend,
  variant = "default",
  className,
  accessibleLabel,
  children,
}: WhatsAppButtonProps) {
  if (!message.trim()) {
    return (
      <Button variant={variant} className={className} aria-label={accessibleLabel} disabled>
        {children}
      </Button>
    );
  }

  const url = whatsAppUrl(recipient.number, personalizeMessage(message, recipient.name));

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    // onSend re-renders synchronously and can retarget this link before the browser follows it.
    event.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
    onSend(recipient.number);
  };

  return (
    <Button
      variant={variant}
      className={className}
      nativeButton={false}
      onClick={handleClick}
      render={
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel} />
      }
    >
      {children}
    </Button>
  );
}

function ResetCampaignButton({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  const handleAsk = () => setConfirming(true);
  const handleCancel = () => setConfirming(false);
  const handleConfirm = () => {
    onReset();
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <Button variant="ghost" className="h-11 w-full" onClick={handleAsk}>
        <RotateCcw aria-hidden />
        Recommencer une nouvelle campagne
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm">Effacer le suivi des clients contactés ?</p>
      <div className="flex gap-2">
        <Button variant="destructive" className="h-11 flex-1" onClick={handleConfirm}>
          Oui, recommencer
        </Button>
        <Button variant="outline" className="h-11 flex-1" onClick={handleCancel}>
          Retour
        </Button>
      </div>
    </div>
  );
}

export function WhatsAppBroadcast({
  recipients,
  defaultMessage,
}: {
  recipients: WhatsAppRecipient[];
  defaultMessage: string;
}) {
  const storedRaw = useSyncExternalStore(
    subscribeToCampaign,
    readStoredCampaign,
    getServerCampaign,
  );
  const campaign = useMemo(
    () => parseCampaign(storedRaw, defaultMessage),
    [storedRaw, defaultMessage],
  );
  const contacted = useMemo(() => new Set(campaign.contacted), [campaign.contacted]);

  const contactedCount = recipients.filter((recipient) => contacted.has(recipient.number)).length;
  const nextRecipient = recipients.find((recipient) => !contacted.has(recipient.number));

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    saveCampaign({ ...campaign, message: event.target.value });
  };

  const handleSend = (number: string) => {
    if (contacted.has(number)) return;
    saveCampaign({ ...campaign, contacted: [...campaign.contacted, number] });
  };

  const handleReset = () => {
    saveCampaign({ ...campaign, contacted: [] });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="whatsapp-message">Message</Label>
        <Textarea
          id="whatsapp-message"
          value={campaign.message}
          onChange={handleMessageChange}
          className="min-h-32"
          aria-describedby="whatsapp-message-hint"
        />
        <p id="whatsapp-message-hint" className="text-sm text-muted-foreground">
          Écrivez {NAME_PLACEHOLDER} pour mettre le nom du client.
        </p>
      </div>

      <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Progress value={contactedCount} max={recipients.length}>
          <ProgressLabel>Clients contactés</ProgressLabel>
          <ProgressValue>{() => `${contactedCount} / ${recipients.length}`}</ProgressValue>
        </Progress>
        {nextRecipient ? (
          <div className="space-y-2">
            <WhatsAppButton
              recipient={nextRecipient}
              message={campaign.message}
              onSend={handleSend}
              className="h-12 w-full gap-2 text-base"
            >
              <MessageCircle aria-hidden />
              <span className="min-w-0 truncate">Envoyer à {recipientLabel(nextRecipient)}</span>
            </WhatsAppButton>
            <p className="text-sm text-muted-foreground">
              WhatsApp s&apos;ouvre avec le message prêt. Envoyez-le, revenez ici, puis touchez à
              nouveau le bouton pour le client suivant.
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-2 font-medium text-success">
            <Check className="size-5" aria-hidden />
            Tous les clients ont été contactés.
          </p>
        )}
        {contactedCount > 0 ? <ResetCampaignButton onReset={handleReset} /> : null}
      </div>

      <ul className="space-y-2" aria-label="Clients avec un numéro WhatsApp">
        {recipients.map((recipient) => {
          const isContacted = contacted.has(recipient.number);
          const actionLabel = isContacted ? "Renvoyer" : "Envoyer";
          return (
            <li
              key={recipient.number}
              className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{recipient.name ?? "Client"}</p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {formatWhatsAppNumber(recipient.number)}
                </p>
                {isContacted ? (
                  <p className="flex items-center gap-1 text-sm text-success">
                    <Check className="size-3.5" aria-hidden />
                    Contacté
                  </p>
                ) : null}
              </div>
              <WhatsAppButton
                recipient={recipient}
                message={campaign.message}
                onSend={handleSend}
                variant={isContacted ? "outline" : "default"}
                className="h-11 shrink-0 px-4"
                accessibleLabel={`${actionLabel} le message à ${recipientLabel(recipient)} sur WhatsApp`}
              >
                {actionLabel}
              </WhatsAppButton>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
