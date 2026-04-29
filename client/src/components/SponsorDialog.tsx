import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sponsor } from "@shared/types";

interface SponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor: Sponsor | null;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

export function SponsorDialog({
  open,
  onOpenChange,
  sponsor,
  onClose,
  onSubmit,
}: SponsorDialogProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    status: "Noch nicht kontaktiert",
    notes: "",
  });

  useEffect(() => {
    if (sponsor) {
      setFormData({
        companyName: sponsor.companyName,
        contactPerson: sponsor.contactPerson,
        email: sponsor.email,
        status: sponsor.status,
        notes: sponsor.notes || "",
      });
    } else {
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        status: "Noch nicht kontaktiert",
        notes: "",
      });
    }
  }, [sponsor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {sponsor ? "Sponsor bearbeiten" : "Neuer Sponsor"}
            </DialogTitle>
            <DialogDescription>
              Geben Sie die Details des Sponsors ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Firmenname</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Ansprechpartner</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Noch nicht kontaktiert">
                    Noch nicht kontaktiert
                  </SelectItem>
                  <SelectItem value="E-Mail in Vorbereitung">
                    E-Mail in Vorbereitung
                  </SelectItem>
                  <SelectItem value="E-Mail gesendet">
                    E-Mail gesendet
                  </SelectItem>
                  <SelectItem value="Antwort erhalten">
                    Antwort erhalten
                  </SelectItem>
                  <SelectItem value="Absage">Absage</SelectItem>
                  <SelectItem value="Zusage/Partner">Zusage/Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit">Speichern</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
