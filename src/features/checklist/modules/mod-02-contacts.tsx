"use client";

import * as React from "react";
import { Plus, Trash2, Phone, Mail, Globe, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import type { ChecklistData, FieldMetaRecord, PhoneItem, EmailItem, ContactPerson } from "../types";
import { cn } from "@/lib/utils";

const PHONE_TAGS = [
  { id: "recepcao", label: "Recepção / Hóspede" },
  { id: "seguranca_2fa", label: "Segurança & 2FA / SMS Extranets" },
  { id: "financeiro", label: "Financeiro & Cobrança" },
  { id: "emergencia", label: "Emergência / Noturno" },
] as const;

const EMAIL_TAGS = [
  { id: "recepcao", label: "Recepção / Hóspede" },
  { id: "seguranca_2fa", label: "Segurança & 2FA / Login" },
  { id: "mensagens", label: "Mensagens das OTAs" },
  { id: "financeiro", label: "Financeiro & Cobrança" },
] as const;

const FUNCOES_RESPONSAVEL = [
  "Proprietário(a)",
  "Gerente",
  "Financeiro",
  "Recepção",
  "Reservas",
  "Outro",
];

export function Mod02Contacts({
  data,
  meta,
  onChange,
  onMetaChange,
}: {
  data: ChecklistData;
  meta: FieldMetaRecord;
  onChange: (patch: Partial<ChecklistData>) => void;
  onMetaChange: (fieldKey: string, val: any) => void;
}) {
  const telefones = data.telefones ?? [];
  const emails = data.emails ?? [];
  const responsaveis = data.responsaveis ?? [];

  // Telefones
  function addPhone() {
    const novo: PhoneItem = {
      id: crypto.randomUUID(),
      numero: "",
      rotulo: "",
      isWhats: true,
      tags: ["recepcao"],
    };
    onChange({ telefones: [...telefones, novo] });
  }

  function updatePhone(index: number, patch: Partial<PhoneItem>) {
    const updated = telefones.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ telefones: updated });
  }

  function removePhone(index: number) {
    onChange({ telefones: telefones.filter((_, i) => i !== index) });
  }

  function togglePhoneTag(index: number, tagId: string) {
    const current = telefones[index];
    const tags = current.tags.includes(tagId) ? current.tags.filter((t) => t !== tagId) : [...current.tags, tagId];
    updatePhone(index, { tags });
  }

  // E-mails
  function addEmail() {
    const novo: EmailItem = {
      id: crypto.randomUUID(),
      email: "",
      rotulo: "",
      tags: ["recepcao"],
    };
    onChange({ emails: [...emails, novo] });
  }

  function updateEmail(index: number, patch: Partial<EmailItem>) {
    const updated = emails.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ emails: updated });
  }

  function removeEmail(index: number) {
    onChange({ emails: emails.filter((_, i) => i !== index) });
  }

  function toggleEmailTag(index: number, tagId: string) {
    const current = emails[index];
    const tags = current.tags.includes(tagId) ? current.tags.filter((t) => t !== tagId) : [...current.tags, tagId];
    updateEmail(index, { tags });
  }

  // Responsáveis
  function addPerson() {
    const nova: ContactPerson = {
      id: crypto.randomUUID(),
      nome: "",
      funcao: "Gerente",
      telefone: "",
      whatsapp: true,
      email: "",
      aprova: "",
    };
    onChange({ responsaveis: [...responsaveis, nova] });
  }

  function updatePerson(index: number, patch: Partial<ContactPerson>) {
    const updated = responsaveis.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ responsaveis: updated });
  }

  function removePerson(index: number) {
    onChange({ responsaveis: responsaveis.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Telefones */}
      <FormSection title="Telefones do Estabelecimento & Finalidades">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Adicione os números da propriedade e assinale suas finalidades de uso.
            </p>
            <Button variant="ghost" size="sm" onClick={addPhone} className="h-7 text-xs">
              <Plus className="mr-1 size-3.5" /> Adicionar telefone
            </Button>
          </div>

          {telefones.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-4 text-center text-xs text-ink-secondary">
              Nenhum telefone adicionado. Adicione o número principal da propriedade.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {telefones.map((tel, idx) => (
                <div key={tel.id} className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 shrink-0 text-ink-secondary" />
                    <Input
                      value={tel.numero}
                      onChange={(e) => updatePhone(idx, { numero: e.target.value })}
                      placeholder="+55 (00) 00000-0000"
                      className="max-w-xs"
                    />
                    <Input
                      value={tel.rotulo ?? ""}
                      onChange={(e) => updatePhone(idx, { rotulo: e.target.value })}
                      placeholder="Rótulo (ex.: Celular Pousada)"
                      className="max-w-[180px]"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tel.isWhats}
                        onChange={(e) => updatePhone(idx, { isWhats: e.target.checked })}
                        className="rounded"
                      />
                      <span>WhatsApp</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhone(idx)}
                      className="ml-auto size-7 text-ink-muted hover:text-feedback-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pl-7">
                    <span className="text-[11px] font-medium text-ink-muted">Finalidades:</span>
                    {PHONE_TAGS.map((tag) => {
                      const active = tel.tags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => togglePhoneTag(idx, tag.id)}
                          className={cn(
                            "rounded px-2 py-0.5 text-[11px] font-medium transition-colors border cursor-pointer",
                            active
                              ? "bg-cyan-fact/20 text-ink font-semibold border-cyan-fact"
                              : "bg-surface text-ink-secondary border-line-subtle hover:bg-surface-hover"
                          )}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      {/* E-mails Oficiais Etiquetados */}
      <FormSection title="E-mails Oficiais do Estabelecimento & Finalidades">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Adicione os endereços de e-mail e selecione as finalidades de cada um.
            </p>
            <Button variant="ghost" size="sm" onClick={addEmail} className="h-7 text-xs">
              <Plus className="mr-1 size-3.5" /> Adicionar e-mail
            </Button>
          </div>

          {emails.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-4 text-center text-xs text-ink-secondary">
              Nenhum e-mail adicionado. Clique acima para cadastrar os e-mails oficiais.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {emails.map((em, idx) => (
                <div key={em.id} className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 shrink-0 text-ink-secondary" />
                    <Input
                      value={em.email}
                      onChange={(e) => updateEmail(idx, { email: e.target.value })}
                      placeholder="contato@propriedade.com.br"
                      className="max-w-xs"
                    />
                    <Input
                      value={em.rotulo ?? ""}
                      onChange={(e) => updateEmail(idx, { rotulo: e.target.value })}
                      placeholder="Rótulo (ex.: Reservas, Geral)"
                      className="max-w-[180px]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmail(idx)}
                      className="ml-auto size-7 text-ink-muted hover:text-feedback-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pl-7">
                    <span className="text-[11px] font-medium text-ink-muted">Finalidades:</span>
                    {EMAIL_TAGS.map((tag) => {
                      const active = em.tags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleEmailTag(idx, tag.id)}
                          className={cn(
                            "rounded px-2 py-0.5 text-[11px] font-medium transition-colors border cursor-pointer",
                            active
                              ? "bg-cyan-fact/20 text-ink font-semibold border-cyan-fact"
                              : "bg-surface text-ink-secondary border-line-subtle hover:bg-surface-hover"
                          )}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      {/* Recepção & Horários */}
      <FormSection title="Recepção & Atendimento">
        <FieldWrapper
          label="Recepção 24 horas?"
          fieldKey="recepcao24h"
          meta={meta.recepcao24h}
          onMetaChange={onMetaChange}
          isFilled={data.recepcao24h !== undefined}
        >
          <div className="flex gap-2">
            {[
              { val: true, label: "Sim, 24 horas" },
              { val: false, label: "Não, horário limitado" },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => onChange({ recepcao24h: opt.val })}
                className={cn(
                  "rounded-lg px-4 py-2 text-xs font-medium border transition-colors cursor-pointer",
                  data.recepcao24h === opt.val
                    ? "border-cyan-fact bg-cyan-fact/10 text-ink font-semibold"
                    : "border-line-subtle bg-surface text-ink-muted hover:border-line-medium"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FieldWrapper>

        {data.recepcao24h === false && (
          <FieldWrapper
            label="Horário da recepção"
            fieldKey="recepcaoInicio"
            meta={meta.recepcaoInicio}
            onMetaChange={onMetaChange}
            isFilled={!!data.recepcaoInicio && !!data.recepcaoFim}
          >
            <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 max-w-sm">
              <span className="text-xs text-ink-muted">Das</span>
              <Input
                type="time"
                value={data.recepcaoInicio ?? ""}
                onChange={(e) => onChange({ recepcaoInicio: e.target.value })}
              />
              <span className="text-xs text-ink-muted">às</span>
              <Input
                type="time"
                value={data.recepcaoFim ?? ""}
                onChange={(e) => onChange({ recepcaoFim: e.target.value })}
              />
            </div>
          </FieldWrapper>
        )}
      </FormSection>

      {/* Pessoas Responsáveis */}
      <FormSection title="Pessoas Responsáveis (Contato com a Rateway)">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Pessoas de referência para dúvidas operacionais, financeiras ou gerenciais.
            </p>
            <Button variant="ghost" size="sm" onClick={addPerson} className="h-7 text-xs">
              <Plus className="mr-1 size-3.5" /> Adicionar responsável
            </Button>
          </div>

          {responsaveis.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-4 text-center text-xs text-ink-secondary">
              Nenhum responsável cadastrado. Adicione a pessoa de contato da propriedade.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {responsaveis.map((p, idx) => (
                <div key={p.id} className="flex flex-col gap-2.5 rounded-lg border border-line-subtle bg-surface-muted/40 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr_auto] items-center gap-2">
                    <Select
                      value={p.funcao}
                      onChange={(e) => updatePerson(idx, { funcao: e.target.value })}
                    >
                      {FUNCOES_RESPONSAVEL.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>
                    <Input
                      value={p.nome}
                      onChange={(e) => updatePerson(idx, { nome: e.target.value })}
                      placeholder="Nome do contato"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        value={p.telefone ?? ""}
                        onChange={(e) => updatePerson(idx, { telefone: e.target.value })}
                        placeholder="Telefone"
                      />
                      <label className="flex items-center gap-1 text-xs text-ink cursor-pointer shrink-0 select-none">
                        <input
                          type="checkbox"
                          checked={p.whatsapp ?? false}
                          onChange={(e) => updatePerson(idx, { whatsapp: e.target.checked })}
                          className="rounded"
                        />
                        <span>Whats?</span>
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePerson(idx)}
                      className="size-7 text-ink-muted hover:text-feedback-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] items-center gap-2">
                    <Input
                      value={p.email ?? ""}
                      onChange={(e) => updatePerson(idx, { email: e.target.value })}
                      placeholder="E-mail do responsável"
                    />
                    <Input
                      value={p.aprova ?? ""}
                      onChange={(e) => updatePerson(idx, { aprova: e.target.value })}
                      placeholder="O que pode aprovar (ex.: tarifas, políticas, financeiro)"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}
