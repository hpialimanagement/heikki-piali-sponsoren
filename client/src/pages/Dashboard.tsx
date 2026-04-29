import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { SponsorDialog } from "@/components/SponsorDialog";
import { Sponsor } from "@shared/types";

const STATUS_COLORS: Record<string, string> = {
  "Noch nicht kontaktiert": "bg-slate-100 text-slate-900",
  "E-Mail in Vorbereitung": "bg-yellow-100 text-yellow-900",
  "E-Mail gesendet": "bg-blue-100 text-blue-900",
  "Antwort erhalten": "bg-purple-100 text-purple-900",
  "Absage": "bg-red-100 text-red-900",
  "Zusage/Partner": "bg-green-100 text-green-900",
};

export default function Dashboard() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Lade Daten aus der JSON-Datei im Repo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/hpialimanagement/heikki-piali-sponsoren/main/data/sponsors.json"
        );
        if (response.ok) {
          const data = await response.json();
          setSponsors(data);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Sponsoren:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter sponsors
  const filteredSponsors = useMemo(() => {
    return sponsors.filter((sponsor) => {
      const matchesSearch =
        sponsor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || sponsor.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sponsors, searchTerm, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: sponsors.length,
      contacted: sponsors.filter(
        (s) =>
          s.status !== "Noch nicht kontaktiert" &&
          s.status !== "E-Mail in Vorbereitung"
      ).length,
      responses: sponsors.filter((s) => s.status === "Antwort erhalten").length,
      rejections: sponsors.filter((s) => s.status === "Absage").length,
      partners: sponsors.filter((s) => s.status === "Zusage/Partner").length,
    };
  }, [sponsors]);

  const handleDelete = (id: number) => {
    if (confirm("Sind Sie sicher, dass Sie diesen Sponsor löschen möchten?")) {
      setSponsors((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSponsor(null);
    setIsDialogOpen(true);
  };

  const handleSaveSponsor = (data: any) => {
    if (editingSponsor) {
      setSponsors((prev) =>
        prev.map((s) =>
          s.id === editingSponsor.id
            ? { ...s, ...data, updatedAt: new Date().toISOString() }
            : s
        )
      );
    } else {
      const nextId =
        sponsors.length > 0 ? Math.max(...sponsors.map((s) => s.id)) + 1 : 1;
      const newSponsor = {
        id: nextId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSponsors((prev) => [...prev, newSponsor]);
    }
    setIsDialogOpen(false);
    setEditingSponsor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Sponsoring-Kontakte
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Sponsor
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kontaktiert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.contacted}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Antworten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.responses}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejections}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.partners}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Suche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nach Name, Ansprechpartner oder E-Mail suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="Noch nicht kontaktiert">
                  Noch nicht kontaktiert
                </SelectItem>
                <SelectItem value="E-Mail in Vorbereitung">
                  E-Mail in Vorbereitung
                </SelectItem>
                <SelectItem value="E-Mail gesendet">E-Mail gesendet</SelectItem>
                <SelectItem value="Antwort erhalten">
                  Antwort erhalten
                </SelectItem>
                <SelectItem value="Absage">Absage</SelectItem>
                <SelectItem value="Zusage/Partner">Zusage/Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sponsors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsoren-Liste</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Wird geladen...
            </div>
          ) : filteredSponsors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Sponsoren gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firmenname</TableHead>
                    <TableHead>Ansprechpartner</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsors.map((sponsor) => (
                    <TableRow key={sponsor.id}>
                      <TableCell className="font-medium">
                        {sponsor.companyName}
                      </TableCell>
                      <TableCell>{sponsor.contactPerson}</TableCell>
                      <TableCell>{sponsor.email}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[sponsor.status]}>
                          {sponsor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(sponsor)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sponsor.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for adding/editing sponsors */}
      <SponsorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        sponsor={editingSponsor}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSaveSponsor}
      />
    </div>
  );
}
