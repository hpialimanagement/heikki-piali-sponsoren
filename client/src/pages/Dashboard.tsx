import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: sponsors = [], isLoading, refetch } = trpc.sponsors.list.useQuery();
  const deleteMutation = trpc.sponsors.delete.useMutation({
    onSuccess: () => refetch(),
  });

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

  const handleDelete = async (id: number) => {
    if (confirm("Sind Sie sicher, dass Sie diesen Sponsor löschen möchten?")) {
      await deleteMutation.mutateAsync({ id });
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

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSponsor(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sponsoring Management</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Sponsoring-Kontakte und deren Status
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
            <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Antworten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.responses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.partners}</div>
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
                <SelectItem value="Noch nicht kontaktiert">Noch nicht kontaktiert</SelectItem>
                <SelectItem value="E-Mail in Vorbereitung">E-Mail in Vorbereitung</SelectItem>
                <SelectItem value="E-Mail gesendet">E-Mail gesendet</SelectItem>
                <SelectItem value="Antwort erhalten">Antwort erhalten</SelectItem>
                <SelectItem value="Absage">Absage</SelectItem>
                <SelectItem value="Zusage/Partner">Zusage/Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredSponsors.length} von {sponsors.length} Sponsoren angezeigt
          </p>
        </CardContent>
      </Card>

      {/* Sponsors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsoren-Liste</CardTitle>
          <CardDescription>
            Alle Sponsoring-Kontakte mit ihrem aktuellen Status
          </CardDescription>
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
                    <TableHead>Notizen</TableHead>
                    <TableHead>E-Mail versendet</TableHead>
                    <TableHead>Antwort erhalten</TableHead>
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
                      <TableCell className="text-sm">{sponsor.email}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[sponsor.status]}>
                          {sponsor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {sponsor.notes || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sponsor.emailSentDate
                          ? new Date(sponsor.emailSentDate).toLocaleDateString("de-CH")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sponsor.responseDate
                          ? new Date(sponsor.responseDate).toLocaleDateString("de-CH")
                          : "-"}
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
                            disabled={deleteMutation.isPending}
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
        onClose={handleDialogClose}
      />
    </div>
  );
}
