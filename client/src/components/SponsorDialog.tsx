import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sponsor } from "@shared/types";

interface SponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor?: Sponsor | null;
  onClose: () => void;
}

export function SponsorDialog({
  open,
  onOpenChange,
  sponsor,
  onClose,
}: SponsorDialogProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    notes: "",
    status: "Noch nicht kontaktiert" as "Noch nicht kontaktiert" | "E-Mail in Vorbereitung" | "E-Mail gesendet" | "Antwort erhalten" | "Absage" | "Zusage/Partner",
    emailSentDate: "",
    responseDate: "",
  });

  useEffect(() => {
    if (sponsor) {
      setFormData({
        companyName: sponsor.companyName,
        contactPerson: sponsor.contactPerson,
        email: sponsor.email,
        notes: sponsor.notes || "",
        status: sponsor.status,
        emailSentDate: sponsor.emailSentDate
          ? new Date(sponsor.emailSentDate).toISOString().split("T")[0]
          : "",
        responseDate: sponsor.responseDate
          ? new Date(sponsor.responseDate).toISOString().split("T")[0]
          : "",
      });
    } else {
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        notes: "",
        status: "Noch nicht kontaktiert" as "Noch nicht kontaktiert" | "E-Mail in Vorbereitung" | "E-Mail gesendet" | "Antwort erhalten" | "Absage" | "Zusage/Partner",
        emailSentDate: "",
        responseDate: "",
      });
    }
  }, [sponsor, open]);

  const createMutation = trpc.sponsors.create.useMutation();
  const updateMutation = trpc.sponsors.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (sponsor) {
        await updateMutation.mutateAsync({
          id: sponsor.id,
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          notes: formData.notes || undefined,
          status: formData.status,
          emailSentDate: formData.emailSentDate
            ? new Date(formData.emailSentDate)
            : null,
          responseDate: formData.responseDate
            ? new Date(formData.responseDate)
            : null,
        });
      } else {
        await createMutation.mutateAsync({
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          notes: formData.notes || undefined,
          status: formData.status,
        });
      }
      onOpenChange(false);
      onClose();
    } catch (error) {
      console.error("Error saving sponsor:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {sponsor ? "Sponsor bearbeiten" : "Neuer Sponsor"}
          </DialogTitle>
          <DialogDescription>
            {sponsor
              ? "Aktualisieren Sie die Informationen des Sponsors"
              : "Fügen Sie einen neuen Sponsor hinzu"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Firmenname *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              placeholder="z.B. Acme Corp"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Ansprechpartner *</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
              placeholder="z.B. Max Mustermann"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="z.B. max@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData({ ...formData, status: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Noch nicht kontaktiert">
                  Noch nicht kontaktiert
                </SelectItem>
                <SelectItem value="E-Mail in Vorbereitung">
                  E-Mail in Vorbereitung
                </SelectItem>
                <SelectItem value="E-Mail gesendet">E-Mail gesendet</SelectItem>
                <SelectItem value="Antwort erhalten">Antwort erhalten</SelectItem>
                <SelectItem value="Absage">Absage</SelectItem>
                <SelectItem value="Zusage/Partner">Zusage/Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSentDate">E-Mail versendet am</Label>
            <Input
              id="emailSentDate"
              type="date"
              value={formData.emailSentDate}
              onChange={(e) =>
                setFormData({ ...formData, emailSentDate: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responseDate">Antwort erhalten am</Label>
            <Input
              id="responseDate"
              type="date"
              value={formData.responseDate}
              onChange={(e) =>
                setFormData({ ...formData, responseDate: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Interne Notizen, Gesprächsnotizen, nächste Schritte..."
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
