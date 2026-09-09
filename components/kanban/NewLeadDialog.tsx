"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateLead } from "@/hooks/kanban/useCreateLead";
import { useContactList } from "@/hooks/contacts/useContactList";
import { useCreateContact } from "@/hooks/contacts/useCreateContact";
import type { Stage } from "@/lib/kanban/types";
import type { Contact } from "@/lib/types/contacts";
import { createLeadSchema, type CreateLeadInput } from "@/lib/schemas/leads";
import { X } from "@/lib/ui/icons";

interface FormShape {
  title: string;
  description: string;
  stage_id: string;
  valueReais: string;
  tagsRaw: string;
  expected_close_date: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pipelineId: string;
  stages: Stage[];
  /** Se vier de um "+" de coluna, já chega com a etapa daquela coluna. */
  initialStageId?: string;
}

function defaultStageId(stages: Stage[]): string {
  const open = stages.find((s) => !s.is_won && !s.is_lost && !s.is_archived);
  return open?.id ?? stages[0]?.id ?? "";
}

function contactLabel(c: Contact): string {
  return c.display_name || c.name || c.phone_number || c.email || "Sem nome";
}

export function NewLeadDialog({
  open,
  onOpenChange,
  pipelineId,
  stages,
  initialStageId,
}: Props) {
  const create = useCreateLead(pipelineId);
  const createContact = useCreateContact();
  const initialStage = useMemo(
    () => initialStageId ?? defaultStageId(stages),
    [stages, initialStageId],
  );

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(contactQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [contactQuery]);

  const contactSearch = useContactList({
    search: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
  });
  const results: Contact[] =
    debouncedQuery.length >= 2
      ? (contactSearch.data?.pages.flatMap((p) => p.data) ?? [])
      : [];

  // Fecha a lista de resultados ao clicar fora.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!inputWrapperRef.current?.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const form = useForm<FormShape>({
    defaultValues: {
      title: "",
      description: "",
      stage_id: initialStage,
      valueReais: "",
      tagsRaw: "",
      expected_close_date: "",
    },
  });

  // Sempre que o diálogo abre (inclusive vindo de um "+" de coluna diferente),
  // realinha a etapa selecionada com a etapa pedida.
  useEffect(() => {
    if (open) {
      form.setValue("stage_id", initialStage);
    }
  }, [open, initialStage, form]);

  // Reseta a busca de contato toda vez que o diálogo fecha.
  useEffect(() => {
    if (!open) {
      setSelectedContact(null);
      setContactQuery("");
      setDebouncedQuery("");
      setShowResults(false);
    }
  }, [open]);

  function handleSelectContact(c: Contact) {
    setSelectedContact(c);
    setContactQuery("");
    setShowResults(false);
    // Só preenche o título automaticamente se o usuário ainda não escreveu nada.
    if (!form.getValues("title").trim()) {
      form.setValue("title", contactLabel(c));
    }
  }

  function handleClearContact() {
    setSelectedContact(null);
  }

  async function handleCreateContactFromQuery() {
    const name = contactQuery.trim();
    if (!name) return;
    try {
      const res = await createContact.mutateAsync({ name, source: "manual" });
      handleSelectContact(res.data);
      toast.success("Contato criado");
    } catch {
      // toast já mostrado pelo hook
    }
  }

  async function onSubmit(values: FormShape) {
    const tags = values.tagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const reais = values.valueReais.trim();
    let valueCents: number | null = null;
    if (reais.length > 0) {
      const normalized = reais.replace(/\./g, "").replace(",", ".");
      const n = Number(normalized);
      if (!Number.isFinite(n) || n < 0) {
        form.setError("valueReais", { message: "Valor inválido" });
        return;
      }
      valueCents = Math.round(n * 100);
    }

    const payload: Record<string, unknown> = {
      pipeline_id: pipelineId,
      stage_id: values.stage_id,
      title: values.title.trim(),
      currency: "BRL",
      source: "manual",
      tags,
    };
    if (selectedContact) payload.contact_id = selectedContact.id;
    if (values.description.trim()) payload.description = values.description.trim();
    if (valueCents !== null) payload.value_cents = valueCents;
    if (values.expected_close_date) payload.expected_close_date = values.expected_close_date;

    const parsed = createLeadSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? "Dados inválidos");
      return;
    }

    try {
      await create.mutateAsync(parsed.data as CreateLeadInput);
      toast.success("Lead criado");
      form.reset({
        title: "",
        description: "",
        stage_id: initialStage,
        valueReais: "",
        tagsRaw: "",
        expected_close_date: "",
      });
      setSelectedContact(null);
      onOpenChange(false);
    } catch {
      // toast already shown
    }
  }

  const stageId = form.watch("stage_id");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Crie um lead manualmente neste pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2" ref={inputWrapperRef}>
            <Label htmlFor="contact-search">Contato</Label>
            {selectedContact ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {contactLabel(selectedContact)}
                  </span>
                  {selectedContact.phone_number && (
                    <span className="text-xs text-text-muted">
                      {selectedContact.phone_number}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearContact}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:bg-surface hover:text-text"
                  aria-label="Remover contato selecionado"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="contact-search"
                  placeholder="Buscar contato por nome ou telefone…"
                  value={contactQuery}
                  onChange={(e) => {
                    setContactQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  autoComplete="off"
                />
                {showResults && debouncedQuery.length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-md">
                    {contactSearch.isLoading ? (
                      <div className="px-3 py-2 text-xs text-text-muted">
                        Buscando…
                      </div>
                    ) : results.length > 0 ? (
                      <ul className="max-h-48 overflow-y-auto py-1">
                        {results.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectContact(c)}
                              className="flex w-full flex-col items-start px-3 py-1.5 text-left text-sm hover:bg-surface-muted/60"
                            >
                              <span className="font-medium">{contactLabel(c)}</span>
                              {c.phone_number && (
                                <span className="text-xs text-text-muted">
                                  {c.phone_number}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col gap-1 p-2">
                        <span className="px-1 text-xs text-text-muted">
                          Nenhum contato encontrado.
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={createContact.isPending}
                          onClick={handleCreateContactFromQuery}
                        >
                          {createContact.isPending
                            ? "Criando…"
                            : `Criar contato "${contactQuery.trim()}"`}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Pedido Maria — combo presente"
              {...form.register("title", { required: true, minLength: 2 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Contexto, observações, links…"
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Etapa</Label>
            <Select
              value={stageId}
              onValueChange={(v) => form.setValue("stage_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages
                  .filter((s) => !s.is_archived)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="valueReais">Valor (R$)</Label>
              <Input
                id="valueReais"
                inputMode="decimal"
                placeholder="0,00"
                {...form.register("valueReais")}
              />
              {form.formState.errors.valueReais && (
                <p className="text-xs text-error-fg">
                  {form.formState.errors.valueReais.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Fechamento previsto</Label>
              <Input
                id="expected_close_date"
                type="date"
                {...form.register("expected_close_date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagsRaw">Tags (separadas por vírgula)</Label>
            <Input
              id="tagsRaw"
              placeholder="vip, recompra"
              {...form.register("tagsRaw")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending || !stageId}>
              {create.isPending ? "Criando…" : "Criar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
