import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LOGO_PDF } from "./logo-pdf";
import type { ChecklistData, FieldMetaRecord, BedConfig, RoomCategoryItem, PointOfInterest } from "./types";

interface ExportPdfOptions {
  clientName: string;
  clientCode?: string;
  city?: string | null;
  state?: string | null;
  status: string;
  data: ChecklistData;
  fieldMeta?: FieldMetaRecord;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40) || "hotel";
}

function formatBeds(camas?: BedConfig[]): string {
  if (!camas || camas.length === 0) return "";
  return camas
    .map((c) => {
      const parts: string[] = [];
      if (c.casal) parts.push(`${c.casal} casal`);
      if (c.queen) parts.push(`${c.queen} queen`);
      if (c.king) parts.push(`${c.king} king`);
      if (c.solteiro) parts.push(`${c.solteiro} solteiro`);
      if (c.beliche) parts.push(`${c.beliche} beliche`);
      if (c.treliche) parts.push(`${c.treliche} treliche`);
      if (c.sofa) parts.push(`${c.sofa} sofá`);
      if (c.camaAuxiliar) parts.push(`${c.camaAuxiliar} extra`);
      if (c.outro) parts.push(`${c.outro} ${c.outroDesc || "outro"}`);
      if (c.obs) parts.push(`(${c.obs})`);
      return parts.join(", ");
    })
    .filter(Boolean)
    .join(" ou ");
}

export function generateChecklistPdf(options: ExportPdfOptions): void {
  const { clientName, clientCode, city, state, status, data, fieldMeta = {} } = options;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // Header Brand Stripes (matching Sistema Rateway.html)
  doc.setFillColor(67, 189, 212);
  doc.rect(0, 0, W / 3, 3, "F");
  doc.setFillColor(255, 226, 105);
  doc.rect(W / 3, 0, W / 3, 3, "F");
  doc.setFillColor(255, 92, 127);
  doc.rect((2 * W) / 3, 0, W / 3, 3, "F");

  // Logo
  try {
    if (LOGO_PDF) {
      doc.addImage("data:image/png;base64," + LOGO_PDF, "PNG", M, 24, 120, 30);
    }
  } catch {
    // Graceful fallback if image decoding is unsupported in environment
  }

  // Document Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(40, 40, 44);
  doc.text("Ficha do estabelecimento", M, 78);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 108);

  const locationStr = [city, state].filter(Boolean).join("/");
  const statusStr = status === "aprovado" ? "Ficha aprovada" : status === "em_revisao" ? "Em revisão" : "Versão em rascunho";
  const dateStr = new Date().toLocaleDateString("pt-BR");
  const codeStr = clientCode ? ` (${clientCode})` : "";
  const subtitle = `${clientName}${codeStr}${locationStr ? ` · ${locationStr}` : ""} · ${statusStr} · Gerado em ${dateStr}`;
  doc.text(subtitle, M, 94);

  let y = 112;
  const headStyle = {
    fillColor: [244, 244, 246] as [number, number, number],
    textColor: [40, 40, 44] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 11,
  };

  const addTag = (fieldKey: string, val: string): string => {
    const meta = fieldMeta[fieldKey];
    if (meta?.status === "pend") return `${val}  [PENDENTE]`;
    if (meta?.status === "conf") return `${val}  [A CONFIRMAR]`;
    return val;
  };

  const str = (val: unknown, fallback = "Não informado"): string => {
    if (val === null || val === undefined || val === "") return fallback;
    if (Array.isArray(val)) return val.length ? val.join(", ") : fallback;
    return String(val);
  };

  // Module 01: Identificação
  const mod1Rows: [string, string][] = [
    ["Nome fantasia", addTag("identificacao.nomeFantasia", str(data.nomeFantasia))],
    ["Razão social", addTag("identificacao.razaoSocial", str(data.razaoSocial))],
    ["CNPJ", addTag("identificacao.cnpj", str(data.cnpj))],
    ["Inscrição municipal", addTag("identificacao.inscMunicipal", str(data.inscMunicipal))],
    ["Inscrição estadual", addTag("identificacao.inscEstadual", str(data.inscEstadual))],
    ["NIRE / Junta Comercial", addTag("identificacao.nire", str(data.nire))],
    ["CADASTUR", addTag("identificacao.cadastur", str(data.cadastur))],
    ["Titular da propriedade", addTag("identificacao.titularNome", `${str(data.titularNome)} (CPF: ${str(data.titularCpf, "—")})`)],
    ["Inauguração / Reforma", addTag("identificacao.inauguracao", `${str(data.inauguracao, "—")} · Reforma: ${str(data.ultimaReforma, "—")}`)],
    [
      "Endereço completo",
      addTag(
        "identificacao.endereco",
        [
          [data.logradouro, data.numero].filter(Boolean).join(", "),
          data.complemento,
          data.bairro,
          [data.cidade, data.uf].filter(Boolean).join(" - "),
          data.cep ? `CEP ${data.cep}` : "",
        ]
          .filter(Boolean)
          .join(" · ") || "Não informado"
      ),
    ],
    ["Link Google Maps", addTag("identificacao.mapsLink", str(data.mapsLink))],
    ["Como chegar", addTag("identificacao.comoChegar", str(data.comoChegar))],
    ["Idiomas falados", addTag("identificacao.idiomas", str(data.idiomas))],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "01 Identificação", colSpan: 2 }]],
    body: mod1Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 02: Contatos
  const telefonesStr = (data.telefones || [])
    .map((t) => `• ${t.numero}${t.rotulo ? ` (${t.rotulo})` : ""}${t.isWhats ? " [WhatsApp]" : ""}`)
    .join("\n") || "Não informado";

  const emailsStr = (data.emails || [])
    .map((e) => `• ${e.email}${e.rotulo ? ` (${e.rotulo})` : ""}${e.tags?.length ? ` [${e.tags.join(", ")}]` : ""}`)
    .join("\n") || str(data.emailReservas);

  const respStr = (data.responsaveis || [])
    .map((r) => `• ${r.nome} — ${r.funcao}${r.telefone ? ` · ${r.telefone}` : ""}${r.email ? ` · ${r.email}` : ""}`)
    .join("\n") || "Não informado";

  const mod2Rows: [string, string][] = [
    ["Telefones", addTag("contatos.telefones", telefonesStr)],
    ["E-mails", addTag("contatos.emails", emailsStr)],
    ["Responsáveis", addTag("contatos.responsaveis", respStr)],
    ["Site oficial", addTag("contatos.siteOficial", str(data.siteOficial ?? data.sitePropriedade ?? data.site))],
    [
      "Recepção",
      addTag(
        "contatos.recepcao24h",
        data.recepcao24h === true ? "24 horas" : `Das ${str(data.recepcaoInicio, "--:--")} às ${str(data.recepcaoFim, "--:--")}`
      ),
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "02 Contatos", colSpan: 2 }]],
    body: mod2Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 03: Canais e Sistemas
  const canaisMap = data.canais || {};
  const canaisStr = Object.entries(canaisMap)
    .map(([canal, info]) => `• ${canal}: ${info.status}${info.idProp ? ` (ID ${info.idProp})` : ""}${info.link ? ` · ${info.link}` : ""}`)
    .join("\n") || "Nenhum canal registrado";

  const mod3Rows: [string, string][] = [
    ["Canais trabalhados", addTag("canais.canais", canaisStr)],
    ["Channel Manager", addTag("canais.channelManager", data.usaFoco ? "FOCO Channel Manager" : str(data.channelManagerOutro))],
    ["PMS", addTag("canais.pms", str(data.pmsOutro))],
    ["Motor de reservas", addTag("canais.motorReservas", str(data.motorReservasLink))],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "03 Canais e sistemas", colSpan: 2 }]],
    body: mod3Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 04: Instalações e Serviços
  const facilidadesAtivas = Object.entries(data.facilidades || {})
    .filter(([, f]) => f?.on)
    .map(([k, f]) => `• ${k}${f?.det ? ` (${f.det})` : ""}`)
    .join("\n");

  const estacDetParts = [
    data.estac,
    data.estacValor ? `R$ ${data.estacValor}` : null,
    data.estacTipo,
    data.estacCobertura,
    data.estacVagas ? `${data.estacVagas} vagas` : null,
    data.estacReserva ? "Reserva prévia" : null,
    data.estacObs ? `Obs: ${data.estacObs}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const cafeDetParts = [
    data.regimesAlimentacao?.length ? `Regimes: ${data.regimesAlimentacao.join(", ")}` : (data.cafe ?? data.cafeFormato),
    data.cafeValor ? `Café avulso: R$ ${data.cafeValor}` : null,
    data.cafeTipo ? `Tipo: ${data.cafeTipo}` : null,
    data.cafeInicio && data.cafeFim ? `Café: das ${data.cafeInicio} às ${data.cafeFim}` : null,
    data.restauranteHorario ? `Almoço/Jantar: ${data.restauranteHorario}` : null,
    data.outrasRefeicoes?.length ? `Estrutura: ${data.outrasRefeicoes.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const mod4Rows: [string, string][] = [
    ["Alimentação & Café", addTag("estrutura.cafe", cafeDetParts || "Não informado")],
    ["Estacionamento", addTag("estrutura.estac", estacDetParts || "Não informado")],
    ["Wi-Fi", addTag("estrutura.wifi", str(data.wifi))],
    ["Áreas comuns & Facilidades", addTag("estrutura.facilidades", facilidadesAtivas || "Nenhuma marcada")],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "04 Instalações e serviços", colSpan: 2 }]],
    body: mod4Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 05: Acomodações
  const categorias: RoomCategoryItem[] = data.categorias || [];
  const mod5Rows: [string, string][] = [];
  if (categorias.length === 0) {
    mod5Rows.push(["Categorias", "Nenhuma acomodação cadastrada"]);
  } else {
    categorias.forEach((a) => {
      const details = [
        [a.tipoVenda, a.tipoQuarto].filter(Boolean).join(" · "),
        a.quantidade ? `${a.quantidade} unidade(s)${a.identificacao ? ` (${a.identificacao})` : ""}` : "",
        a.tamanho ? `${a.tamanho} m²` : "",
        [a.maxAdultos ? `${a.maxAdultos} adultos` : "", a.maxCriancas ? `${a.maxCriancas} crianças` : "", a.maxTotal ? `máx. ${a.maxTotal}` : ""].filter(Boolean).join(", "),
        formatBeds(a.camas),
        [a.banheiro ? `Banheiro ${a.banheiro.toLowerCase()}` : "", a.chuveiro].filter(Boolean).join(" · "),
        a.camaExtra ? `Cama extra: ${a.camaExtra}${a.camaExtraValor ? ` (${a.camaExtraValor})` : ""}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      mod5Rows.push([a.nome || "Sem nome", details || "—"]);
    });
  }

  autoTable(doc, {
    startY: y,
    head: [[{ content: "05 Acomodações", colSpan: 2 }]],
    body: mod5Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 06: Comodidades dos Quartos
  const comods = data.comodidades || {};
  const activeComods = Object.entries(comods)
    .filter(([, v]) => v?.escopo && v.escopo !== "nenhuma")
    .map(([k, v]) => `• ${k}: ${v.escopo === "todas" ? "Todas as unidades" : "Algumas unidades"}${v.det ? ` (${v.det})` : ""}`)
    .join("\n");

  autoTable(doc, {
    startY: y,
    head: [[{ content: "06 Comodidades dos quartos", colSpan: 2 }]],
    body: [["Comodidades ativas", activeComods || "Nenhuma comodidade marcada"]],
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 07: Políticas
  const cancelRegrasStr = (data.cancelamento || [])
    .map((c) => `• Até ${c.ant} ${c.un} antes: reembolso ${c.reemb}%`)
    .join("\n");

  const mod7Rows: [string, string][] = [
    ["Check-in", addTag("politicas.checkin", `Das ${str(data.checkinInicio, "--:--")} às ${str(data.checkinFim, "--:--")}`)],
    ["Check-out", addTag("politicas.checkout", `Até ${str(data.checkoutFim, "--:--")}`)],
    ["Early check-in", addTag("politicas.earlyCheckin", `${str(data.earlyCheckin ?? data.early)}${data.earlyValor ? ` (${data.earlyValor})` : ""}`)],
    ["Late check-out", addTag("politicas.lateCheckout", `${str(data.lateCheckout ?? data.late)}${data.lateValor ? ` (${data.lateValor})` : ""}`)],
    ["Idade mín. / Documentos", addTag("politicas.docs", `Mínimo ${data.idadeMinima ?? 18} anos · Docs: ${str(data.documentos)}`)],
    ["Acesso ao imóvel", addTag("politicas.metodoAcesso", `${str(data.metodoAcesso)}${data.detalhesAcesso ? ` — ${data.detalhesAcesso}` : ""}`)],
    ["Limpeza & Governança", addTag("politicas.limpeza", `Limpeza: ${str(data.limpezaFrequencia)} · Enxoval: ${str(data.trocaEnxoval)}${data.taxaLimpezaEstadia ? ` · Taxa: ${data.taxaLimpezaEstadia}` : ""}`)],
    ["Cancelamento", addTag("politicas.cancelamentoRegra", cancelRegrasStr || str(data.cancelamentoRegra))],
    ["No-Show / Caução", addTag("politicas.noShow", `No-show: ${str(data.noShow ?? data.noShowRegra)} · Caução: ${str(data.caucao, "Não")}`)],
    ["Crianças & Berço", addTag("politicas.criancas", `${data.criancasGratisAte ? `Gratuito até ${data.criancasGratisAte} anos` : "Sem cortesia"} · Berço: ${str(data.berco)}`)],
    ["Pets (Animais)", addTag("politicas.pets", `${str(data.pets)}${data.petTaxa ? ` (${data.petTaxa})` : ""}${data.petRegras ? ` — ${data.petRegras}` : ""}`)],
    ["Fumantes / Festas", addTag("politicas.regrasConvivencia", `Fumantes: ${str(data.fumantes)} · Festas: ${str(data.festas)}`)],
    ["Horário de silêncio", addTag("politicas.silencio", `Das ${str(data.silencioInicio, "--:--")} às ${str(data.silencioFim, "--:--")}`)],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "07 Políticas", colSpan: 2 }]],
    body: mod7Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 08: Pagamentos e Comissões
  const mod8Rows: [string, string][] = [
    [
      "Dados bancários",
      addTag(
        "pagamentos.dadosBancarios",
        [
          `Titular: ${str(data.titularConta)}`,
          `CPF/CNPJ: ${str(data.docConta)}`,
          `Banco: ${str(data.bancoNome)} · Agência: ${str(data.agencia)} · Conta: ${str(data.conta)}`,
          `Chave PIX: ${str(data.chavePix)}`,
        ].join("\n")
      ),
    ],
    ["Formas balcão", addTag("pagamentos.formasBalcao", str(data.formasBalcao))],
    ["Taxa turismo", addTag("pagamentos.taxaTurismo", str(data.taxaTurismo, "Isento"))],
    ["Caução", addTag("pagamentos.caucao", data.caucao ? `Sim (${str(data.caucaoValor)})` : "Não")],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "08 Pagamentos e comissões", colSpan: 2 }]],
    body: mod8Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 09: Localização e Arredores
  const pontos: PointOfInterest[] = data.pontos || [];
  const pontosStr = pontos.map((p) => `• ${p.nome} (${p.tipo}): ${p.dist}`).join("\n") || "Não informado";

  const mod9Rows: [string, string][] = [
    ["Aeroporto mais próximo", addTag("localizacao.aeroporto", `${str(data.aeroportoNome)} (${str(data.aeroportoDist)})`)],
    ["Rodoviária mais próxima", addTag("localizacao.rodoviaria", `${str(data.rodoviariaNome)} (${str(data.rodoviariaDist)})`)],
    ["Pontos de interesse", addTag("localizacao.pontos", pontosStr)],
    ["Rotas de acesso", addTag("localizacao.rotas", str(data.rotas))],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "09 Localização e arredores", colSpan: 2 }]],
    body: mod9Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // Module 10: Textos de Venda & Fotos
  const mod10Rows: [string, string][] = [
    ["Pasta fotos Google Drive", addTag("midia.drivePastaGeral", str(data.drivePastaGeral))],
    ["Instagram oficial", addTag("midia.instagram", str(data.instagram))],
    ["Descrição curta", addTag("midia.descCurta", str(data.descCurta))],
    ["Descrição completa", addTag("midia.descLonga", str(data.descLonga))],
    ["O espaço & Acesso hóspede", addTag("midia.oEspaco", [data.oEspaco, data.acessoHospede].filter(Boolean).join("\n") || "Não informado")],
  ];

  autoTable(doc, {
    startY: y,
    head: [[{ content: "10 Textos de venda e fotos", colSpan: 2 }]],
    body: mod10Rows,
    theme: "grid",
    margin: { left: M, right: M },
    headStyles: headStyle,
    styles: { fontSize: 9.5, cellPadding: 5, textColor: [45, 45, 50], lineColor: [225, 225, 230], lineWidth: 0.5, valign: "top" },
    columnStyles: { 0: { cellWidth: 150, textColor: [100, 100, 108] } },
  });

  // Footer on each page (matching Sistema Rateway.html)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 158);
    doc.text(`Rateway · Inteligência em hospedagem · página ${i} de ${totalPages}`, M, doc.internal.pageSize.getHeight() - 20);
  }

  // Save / Download
  const filename = `ficha-${slugify(clientName)}.pdf`;
  doc.save(filename);
}
