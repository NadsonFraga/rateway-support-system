"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import { cn } from "@/lib/utils";
import type { ChecklistData, FieldMetaRecord } from "../types";

const PROPERTY_TYPES = [
  "Pousada",
  "Hotel",
  "Hostel",
  "Chalés",
  "Casa de temporada",
  "Apartamento",
  "Resort",
  "Camping",
  "Fazenda / hotel fazenda",
  "Outro",
];

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const IDIOMAS = ["Português", "Inglês", "Espanhol", "Francês", "Italiano", "Alemão"];

export function Mod01Identification({
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
  const idiomas = data.idiomas ?? ["Português"];

  function toggleIdioma(item: string) {
    const next = idiomas.includes(item) ? idiomas.filter((i: string) => i !== item) : [...idiomas, item];
    onChange({ idiomas: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <FormSection title="Empresa">
        <FieldWrapper
          label="Nome fantasia"
          fieldKey="nomeFantasia"
          meta={meta.nomeFantasia}
          onMetaChange={onMetaChange}
          isFilled={!!data.nomeFantasia}
        >
          <Input
            value={data.nomeFantasia ?? ""}
            onChange={(e) => onChange({ nomeFantasia: e.target.value })}
            placeholder="Ex.: Hotel Amazônia Prime"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Razão social"
          fieldKey="razaoSocial"
          meta={meta.razaoSocial}
          onMetaChange={onMetaChange}
          isFilled={!!data.razaoSocial}
        >
          <Input
            value={data.razaoSocial ?? ""}
            onChange={(e) => onChange({ razaoSocial: e.target.value })}
            placeholder="Ex.: Amazônia Prime Hotelaria Ltda."
          />
        </FieldWrapper>

        <FieldWrapper
          label="CNPJ"
          fieldKey="cnpj"
          meta={meta.cnpj}
          onMetaChange={onMetaChange}
          isFilled={!!data.cnpj}
        >
          <Input
            value={data.cnpj ?? ""}
            onChange={(e) => onChange({ cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Inscrição municipal"
          fieldKey="inscMunicipal"
          hint="Exigida pela Booking"
          meta={meta.inscMunicipal}
          onMetaChange={onMetaChange}
          isFilled={!!data.inscMunicipal}
        >
          <Input
            value={data.inscMunicipal ?? ""}
            onChange={(e) => onChange({ inscMunicipal: e.target.value })}
            placeholder="Número de registro no município"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Inscrição estadual"
          fieldKey="inscEstadual"
          optional
          hint="Se houver"
          meta={meta.inscEstadual}
          onMetaChange={onMetaChange}
          isFilled={!!data.inscEstadual}
        >
          <Input
            value={data.inscEstadual ?? ""}
            onChange={(e) => onChange({ inscEstadual: e.target.value })}
            placeholder="Isento ou número estadual"
          />
        </FieldWrapper>

        <FieldWrapper
          label="NIRE / Junta Comercial"
          fieldKey="nire"
          optional
          meta={meta.nire}
          onMetaChange={onMetaChange}
          isFilled={!!data.nire}
        >
          <Input
            value={data.nire ?? ""}
            onChange={(e) => onChange({ nire: e.target.value })}
            placeholder="Número da junta comercial"
          />
        </FieldWrapper>

        <FieldWrapper
          label="CADASTUR"
          fieldKey="cadastur"
          optional
          hint="Obrigatório para meios de hospedagem"
          meta={meta.cadastur}
          onMetaChange={onMetaChange}
          isFilled={!!data.cadastur}
        >
          <Input
            value={data.cadastur ?? ""}
            onChange={(e) => onChange({ cadastur: e.target.value })}
            placeholder="Registro Cadastur"
          />
        </FieldWrapper>
      </FormSection>

      <FormSection title="Titular da propriedade">
        <FieldWrapper
          label="Nome do titular"
          fieldKey="titularNome"
          hint="Responsável legal pela propriedade"
          meta={meta.titularNome}
          onMetaChange={onMetaChange}
          isFilled={!!data.titularNome}
        >
          <Input
            value={data.titularNome ?? ""}
            onChange={(e) => onChange({ titularNome: e.target.value })}
            placeholder="Nome do responsável legal"
          />
        </FieldWrapper>

        <FieldWrapper
          label="CPF do titular"
          fieldKey="titularCpf"
          meta={meta.titularCpf}
          onMetaChange={onMetaChange}
          isFilled={!!data.titularCpf}
        >
          <Input
            value={data.titularCpf ?? ""}
            onChange={(e) => onChange({ titularCpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </FieldWrapper>
      </FormSection>

      <FormSection title="Propriedade">
        <FieldWrapper
          label="Tipo de propriedade"
          fieldKey="tipoPropriedade"
          meta={meta.tipoPropriedade}
          onMetaChange={onMetaChange}
          isFilled={!!data.tipoPropriedade}
        >
          <Select
            value={data.tipoPropriedade ?? ""}
            onChange={(e) => onChange({ tipoPropriedade: e.target.value })}
          >
            <option value="">Selecione o tipo</option>
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Total de unidades"
          fieldKey="totalUnidades"
          hint="Soma de todos os quartos/unidades"
          meta={meta.totalUnidades}
          onMetaChange={onMetaChange}
          isFilled={data.totalUnidades !== undefined && data.totalUnidades > 0}
        >
          <Input
            type="number"
            min={0}
            value={data.totalUnidades ?? ""}
            onChange={(e) => onChange({ totalUnidades: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Ex.: 12"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Data de inauguração"
          fieldKey="inauguracao"
          optional
          meta={meta.inauguracao}
          onMetaChange={onMetaChange}
          isFilled={!!data.inauguracao}
        >
          <Input
            type="date"
            value={data.inauguracao ?? ""}
            onChange={(e) => onChange({ inauguracao: e.target.value })}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Última grande reforma"
          fieldKey="ultimaReforma"
          optional
          meta={meta.ultimaReforma}
          onMetaChange={onMetaChange}
          isFilled={!!data.ultimaReforma}
        >
          <Input
            type="date"
            value={data.ultimaReforma ?? ""}
            onChange={(e) => onChange({ ultimaReforma: e.target.value })}
          />
        </FieldWrapper>

        {!!data.ultimaReforma && (
          <FieldWrapper
            label="O que foi reformado"
            fieldKey="reformaDesc"
            hint="Descreva o que mudou na última reforma"
            meta={meta.reformaDesc}
            onMetaChange={onMetaChange}
            isFilled={!!data.reformaDesc}
          >
            <textarea
              value={data.reformaDesc ?? ""}
              onChange={(e) => onChange({ reformaDesc: e.target.value })}
              placeholder="Ex.: Troca de camas, ar-condicionado e pintura..."
              rows={2}
              className="f resize-y w-full"
            />
          </FieldWrapper>
        )}
      </FormSection>

      <FormSection title="Endereço">
        <FieldWrapper
          label="CEP"
          fieldKey="cep"
          meta={meta.cep}
          onMetaChange={onMetaChange}
          isFilled={!!data.cep}
        >
          <Input
            value={data.cep ?? ""}
            onChange={(e) => onChange({ cep: e.target.value })}
            placeholder="00000-000"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Rua e número"
          fieldKey="logradouro"
          meta={meta.logradouro}
          onMetaChange={onMetaChange}
          isFilled={!!data.logradouro}
        >
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Input
              value={data.logradouro ?? ""}
              onChange={(e) => onChange({ logradouro: e.target.value })}
              placeholder="Rua / avenida"
            />
            <Input
              value={data.numero ?? ""}
              onChange={(e) => onChange({ numero: e.target.value })}
              placeholder="Número"
            />
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Complemento"
          fieldKey="complemento"
          optional
          meta={meta.complemento}
          onMetaChange={onMetaChange}
          isFilled={!!data.complemento}
        >
          <Input
            value={data.complemento ?? ""}
            onChange={(e) => onChange({ complemento: e.target.value })}
            placeholder="Bloco, sala, etc."
          />
        </FieldWrapper>

        <FieldWrapper
          label="Bairro"
          fieldKey="bairro"
          meta={meta.bairro}
          onMetaChange={onMetaChange}
          isFilled={!!data.bairro}
        >
          <Input
            value={data.bairro ?? ""}
            onChange={(e) => onChange({ bairro: e.target.value })}
            placeholder="Bairro"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Cidade e UF"
          fieldKey="cidade"
          meta={meta.cidade}
          onMetaChange={onMetaChange}
          isFilled={!!data.cidade}
        >
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Input
              value={data.cidade ?? ""}
              onChange={(e) => onChange({ cidade: e.target.value })}
              placeholder="Cidade"
            />
            <Select
              value={data.uf ?? ""}
              onChange={(e) => onChange({ uf: e.target.value })}
            >
              <option value="">UF</option>
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Link do Google Maps"
          fieldKey="mapsLink"
          meta={meta.mapsLink}
          onMetaChange={onMetaChange}
          isFilled={!!data.mapsLink}
        >
          <Input
            value={data.mapsLink ?? ""}
            onChange={(e) => onChange({ mapsLink: e.target.value })}
            placeholder="https://maps.app.goo.gl/…"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Como chegar"
          fieldKey="comoChegar"
          optional
          hint="Rodovias, acessos, referências"
          meta={meta.comoChegar}
          onMetaChange={onMetaChange}
          isFilled={!!data.comoChegar}
        >
          <textarea
            value={data.comoChegar ?? ""}
            onChange={(e) => onChange({ comoChegar: e.target.value })}
            placeholder="Rodovias, acessos, referências..."
            rows={3}
            className="f resize-y w-full"
          />
        </FieldWrapper>
      </FormSection>

      <FormSection title="Equipe">
        <FieldWrapper
          label="Idiomas falados"
          fieldKey="idiomas"
          optional
          meta={meta.idiomas}
          onMetaChange={onMetaChange}
          isFilled={idiomas.length > 0}
        >
          <div className="flex flex-wrap gap-1.5">
            {IDIOMAS.map((item) => {
              const active = idiomas.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleIdioma(item)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border",
                    active
                      ? "border-cyan-fact bg-cyan-fact/10 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </FieldWrapper>
      </FormSection>
    </div>
  );
}
