/* eslint-disable @typescript-eslint/no-explicit-any */
export async function generateBoletimPDF(boletim: any): Promise<Buffer> {
  const chromium = await import('@sparticuz/chromium');
  const puppeteer = await import('puppeteer-core');

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    || await chromium.default.executablePath();

  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    defaultViewport: chromium.default.defaultViewport,
    executablePath,
    headless: true,
  });
  const page = await browser.newPage();

  const html = buildHtml(boletim);
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
  await browser.close();
  return Buffer.from(pdf);
}

function fmt(val: unknown) { return val ?? ''; }
function yn(val: unknown) { return val ? 'Sim' : 'Não'; }
function sp(obj: any) { return obj?.semParticularidades ? '✓ SP' : (obj?.anotacoes || ''); }

function buildHtml(b: any): string {
  const p = b.patient || {};
  const idade = p.dataNascimento ? calcIdade(p.dataNascimento) : '';
  const tecnicas = [
    b.tecnicaGeral && 'Geral',
    b.tecnicaSedacao && 'Sedação',
    b.tecnicaCondutiva && 'Condutiva',
    b.tecnicaLocalMonit && 'Local com monit.',
  ].filter(Boolean).join(', ');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #000; }
  .header { display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 6px; }
  .header h1 { font-size: 16px; text-align: center; flex: 1; }
  .codigo { font-size: 9px; border: 1px solid #000; padding: 2px 6px; text-align: center; }
  .patient-info { background: #f0f0f0; padding: 4px 6px; font-size: 9px; margin-bottom: 6px; border: 1px solid #ccc; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 6px; }
  .field { border: 1px solid #ccc; padding: 3px 5px; min-height: 22px; }
  .field label { font-size: 8px; color: #555; display: block; }
  .field span { font-size: 10px; font-weight: 600; }
  .section-title { background: #1a56a0; color: white; padding: 3px 6px; font-size: 9px; font-weight: bold; margin: 6px 0 3px; }
  .systems { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; }
  .system-box { border: 1px solid #ccc; padding: 3px 5px; min-height: 28px; }
  .system-box .sys-label { font-size: 8px; font-weight: bold; color: #1a56a0; }
  .lab-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 6px; }
  .asa-box { display: inline-block; width: 22px; height: 22px; border: 1px solid #ccc; text-align: center; line-height: 22px; font-size: 11px; margin-right: 3px; }
  .asa-selected { background: #1a56a0; color: white; border-color: #1a56a0; }
  .tecnica-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .tecnica-box { border: 1px solid #ccc; padding: 3px 5px; text-align: center; font-size: 9px; }
  .tecnica-checked { background: #1a56a0; color: white; }
  .sig-box { border: 1px solid #ccc; min-height: 40px; padding: 3px; display: flex; align-items: center; justify-content: center; }
  .footer { margin-top: 10px; border-top: 1px solid #ccc; padding-top: 4px; font-size: 8px; color: #666; text-align: center; }
</style>
</head><body>
  <div class="header">
    <div style="font-size:11px;font-weight:bold;width:120px">SANTA CASA<br><span style="font-size:9px;font-weight:normal">PORTO ALEGRE</span></div>
    <h1>AVALIAÇÃO PRÉ-ANESTÉSICA</h1>
    <div class="codigo">CÓDIGO<br>FOR 379</div>
  </div>

  <div class="patient-info">
    <strong>${fmt(p.prontuario)} — ${fmt(p.nome)}</strong> &nbsp;|&nbsp;
    Sexo: ${fmt(p.sexo)} &nbsp;|&nbsp; Cor: ${fmt(p.cor)} &nbsp;|&nbsp;
    DN: ${p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR') : ''} &nbsp;|&nbsp; ${idade} &nbsp;|&nbsp;
    Filiação: ${fmt(p.filiacao)} &nbsp;|&nbsp; Atend.: ${fmt(p.atendimento)}
  </div>

  <div class="grid2">
    <div>
      <div class="grid2">
        <div class="field"><label>Cirurgião (serviço)</label><span>${fmt(b.cirurgiao)}</span></div>
        <div class="field"><label>Telefone</label><span>${fmt(b.telefoneCirurgiao)}</span></div>
      </div>
      <div class="field" style="margin-top:4px"><label>Cirurgia / Procedimento proposto</label><span>${fmt(b.procedimento)}</span></div>
      <div class="grid2" style="margin-top:4px">
        <div class="field"><label>Convênio</label><span>${fmt(b.tipoConvenioNome)}</span></div>
        <div class="field"><label>Matrícula</label><span>${fmt(b.matriculaConvenio)}</span></div>
      </div>
    </div>
    <div>
      <div class="field"><label>Endereço</label><span>${fmt(p.endereco)}</span></div>
      <div class="grid2" style="margin-top:4px">
        <div class="field"><label>Hora</label><span>${fmt(b.horaCirurgia)}</span></div>
        <div class="field"><label>Data</label><span>${b.dataCirurgia ? new Date(b.dataCirurgia).toLocaleDateString('pt-BR') : ''}</span></div>
      </div>
      <div class="field" style="margin-top:4px">
        <label>Tipo</label>
        <span>${fmt(b.tipoCirurgia)} &nbsp;|&nbsp; ${fmt(b.ambulatorialInternado)}</span>
      </div>
    </div>
  </div>

  <div class="section-title">ESTADO FÍSICO (ASA) &amp; HISTÓRIA CLÍNICA</div>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;padding:4px 0">
    ${[1,2,3,4,5,6].map(n => `<span class="asa-box ${b.asaEstado === n ? 'asa-selected' : ''}">${n}</span>`).join('')}
    &nbsp;&nbsp;
    <span style="font-size:9px">${b.semParticularidades ? '✓ Sem Particularidades (SP)' : ''}</span>
  </div>

  <div class="section-title">SISTEMAS CLÍNICOS</div>
  <div class="systems">
    <div class="system-box"><span class="sys-label">Cardiovascular</span><br>${sp(b.cardiovascular)}${b.cardiovascular && !b.cardiovascular.semParticularidades ? `<br><small>ECG:${fmt(b.cardiovascular.ecg)} FC:${fmt(b.cardiovascular.fc)} PA:${fmt(b.cardiovascular.pa)}</small>` : ''}</div>
    <div class="system-box"><span class="sys-label">Respiratório</span><br>${sp(b.respiratorio)}${b.respiratorio && !b.respiratorio.semParticularidades ? `<br><small>PaO2:${fmt(b.respiratorio.pao2)} PCO2:${fmt(b.respiratorio.pco2)} VEF1:${fmt(b.respiratorio.vef1)}</small>` : ''}</div>
    <div class="system-box"><span class="sys-label">Neurológico</span><br>${sp(b.neurologico)}</div>
    <div class="system-box"><span class="sys-label">Endócrino/Reprodutor</span><br>${sp(b.endocrinoReprodutor)}</div>
    <div class="system-box"><span class="sys-label">Oncológico</span><br>${sp(b.oncologico)}</div>
    <div class="system-box"><span class="sys-label">Digestivo</span><br>${sp(b.digestivo)}</div>
    <div class="system-box"><span class="sys-label">Renal-Urinário</span><br>${sp(b.renalUrinario)}</div>
    <div class="system-box"><span class="sys-label">Ortopédico</span><br>${sp(b.ortopedico)}</div>
  </div>

  <div class="section-title">EXAMES E LABORATÓRIOS</div>
  <div class="lab-grid">
    ${[['Ht',b.ht],['Hb',b.hb],['Na',b.na],['K',b.k],['Creatinina',b.creatinina],['Uréia',b.ureia],['Glicose',b.glicose],['TP',b.tp],['TTP',b.ttp],['Plaquetas',b.plaquetas]].map(([l,v])=>`<div class="field"><label>${l}</label><span>${fmt(v)}</span></div>`).join('')}
  </div>
  ${b.outroExame ? `<div class="field" style="margin-bottom:6px"><label>Outro</label><span>${b.outroExame}</span></div>` : ''}

  <div class="grid2">
    <div>
      <div class="field" style="margin-bottom:4px"><label>Medicações em uso / Dose / Horário</label><span style="white-space:pre-wrap">${fmt(b.medicacoesEmUso)}</span></div>
      <div class="field" style="margin-bottom:4px"><label>Pré-medicação dosagens, horário</label><span>${fmt(b.preMedicacao)}</span></div>
      <div class="field"><label>NPO a partir das</label><span>${fmt(b.npoDas)}</span></div>
    </div>
    <div>
      <div class="field" style="margin-bottom:4px"><label>Cirurgias / Anestesias prévias – Pós Operatório</label><span style="white-space:pre-wrap">${fmt(b.cirurgiasPrevias)}</span></div>
      <div class="section-title" style="margin-top:4px">VIA AÉREA</div>
      <div class="grid2" style="margin-top:4px">
        <div class="field"><label>Via aérea / Prótese</label><span>${sp(b.viaAerea)}</span></div>
        <div class="field"><label>Mallampatti</label><span>${fmt(b.mallampatti)}</span></div>
      </div>
      <div class="grid2" style="margin-top:4px">
        <div class="field"><label>IOT difícil?</label><span>${b.iotDificil === true ? 'Sim' : b.iotDificil === false ? 'Não' : ''}</span></div>
        <div class="field"><label>Alergias</label><span>${b.alergias?.nega ? 'Nega' : fmt(b.alergias?.texto)}</span></div>
      </div>
      <div class="grid2" style="margin-top:4px">
        <div class="field"><label>Sangramentos/Hematologia</label><span>${b.sangramentosHematologia?.nega ? 'Nega' : fmt(b.sangramentosHematologia?.texto)}</span></div>
        <div class="field"><label>Medicamentos especiais</label><span>${b.medicamentosEspeciais?.sim ? 'Sim: '+fmt(b.medicamentosEspeciais.texto) : 'Não'}</span></div>
      </div>
      <div class="field" style="margin-top:4px"><label>Necessidade de monitorização especial</label><span>${b.monitorizacaoEspecial?.sim ? 'Sim: '+fmt(b.monitorizacaoEspecial.texto) : 'Não'}</span></div>
    </div>
  </div>

  <div class="section-title">TÉCNICA ANESTÉSICA PLANEJADA</div>
  <div class="tecnica-grid" style="margin-bottom:6px">
    ${[['Geral',b.tecnicaGeral],['Sedação',b.tecnicaSedacao],['Condutiva',b.tecnicaCondutiva],['Local com monit.',b.tecnicaLocalMonit]].map(([l,v])=>`<div class="tecnica-box ${v?'tecnica-checked':''}">${v?'✓':' '} ${l}</div>`).join('')}
  </div>

  <div class="grid2">
    <div>
      <div class="field" style="margin-bottom:4px"><label>Anestesiologista</label><span>${fmt(b.anestesiologistaNome || b.user?.nome)}</span></div>
      <div class="field" style="margin-bottom:4px"><label>CREMERS</label><span>${fmt(b.cremers || b.user?.cremers)}</span></div>
      <div class="grid2">
        <div class="field"><label>Hora</label><span>${fmt(b.horaFim)}</span></div>
        <div class="field"><label>Data</label><span>${b.dataFim ? new Date(b.dataFim).toLocaleDateString('pt-BR') : ''}</span></div>
      </div>
    </div>
    <div>
      <div class="field" style="margin-bottom:4px"><label>Assinatura</label>
        <div class="sig-box">${b.assinatura?.imagemBase64 ? `<img src="${b.assinatura.imagemBase64}" style="max-height:35px;max-width:100%"/>` : ''}</div>
      </div>
      <div class="field"><label>Observações</label><span style="white-space:pre-wrap">${fmt(b.observacoes)}</span></div>
    </div>
  </div>

  <!-- SEGUNDA FOLHA: TÉCNICA INTRAOPERATÓRIA -->
  <div style="page-break-before:always"></div>
  <div class="header" style="margin-top:0">
    <div style="font-size:11px;font-weight:bold;width:120px">SANTA CASA<br><span style="font-size:9px;font-weight:normal">PORTO ALEGRE</span></div>
    <h1>BOLETIM ANESTÉSICO — INTRAOPERATÓRIO</h1>
    <div class="codigo">FOR 379<br>Verso</div>
  </div>
  <div class="patient-info" style="margin-bottom:6px">
    <strong>${fmt(p.prontuario)} — ${fmt(p.nome)}</strong> &nbsp;|&nbsp;
    Data: ${b.dataCirurgia ? new Date(b.dataCirurgia).toLocaleDateString('pt-BR') : ''} &nbsp;|&nbsp;
    Procedimento: ${fmt(b.procedimento)}
  </div>

  <div class="grid2" style="margin-bottom:6px">
    <div class="field"><label>Posição do Paciente</label><span>${fmt(b.posicaoPaciente)}</span></div>
    <div class="grid2">
      <div class="field"><label>Início Anestesia</label><span>${fmt(b.horaInicioAnestesia)}</span></div>
      <div class="field"><label>Início Cirurgia</label><span>${fmt(b.horaInicioCirurgia)}</span></div>
    </div>
  </div>

  <div class="section-title">MONITORIZAÇÃO</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;padding:4px 0">
    ${b.monitorizacao ? Object.entries(b.monitorizacao as Record<string,unknown>)
      .filter(([k,v]) => k !== 'outros' && v)
      .map(([k]) => `<span style="background:#1a56a0;color:white;padding:2px 8px;border-radius:10px;font-size:9px">${k.toUpperCase()}</span>`).join('') : ''}
    ${(b.monitorizacao as any)?.outros ? `<span style="font-size:9px">${(b.monitorizacao as any).outros}</span>` : ''}
  </div>

  <div class="section-title">TÉCNICA ANESTÉSICA</div>
  ${b.tecnicaIntraop ? (() => {
    const t = b.tecnicaIntraop as any;
    if (t.tipo === 'geral') return `
      <div style="margin-bottom:6px">
        <div class="field"><label>Tipo</label><span>Anestesia Geral</span></div>
        <div class="field" style="margin-top:3px"><label>Indução</label><span style="white-space:pre-wrap">${fmt(t.geralInducao)}</span></div>
        <div class="field" style="margin-top:3px"><label>Manutenção/Administração</label><span style="white-space:pre-wrap">${fmt(t.geralAdministracao)}</span></div>
      </div>`;
    if (t.tipo === 'raqui') return `
      <div class="field" style="margin-bottom:6px">
        <label>Raquianestesia</label>
        <span>Raquianestesia com agulha ${fmt(t.raquiAgulha)}, no espaço ${fmt(t.raquiEspaco)}, com ${fmt(t.raquiMedicacao)} ${fmt(t.raquiVolume)}.</span>
      </div>`;
    if (t.tipo === 'peridural') return `
      <div class="field" style="margin-bottom:6px">
        <label>Peridural</label>
        <span>Peridural com agulha ${fmt(t.periduralAgulha)}, no espaço ${fmt(t.periduralEspaco)}, com ${fmt(t.periduralMedicacao)} ${fmt(t.periduralVolume)}.</span>
      </div>`;
    if (t.tipo === 'bloqueio') return `<div class="field" style="margin-bottom:6px"><label>Bloqueio</label><span style="white-space:pre-wrap">${fmt(t.bloqueioDescricao)}</span></div>`;
    return `<div class="field" style="margin-bottom:6px"><label>Tipo</label><span>${fmt(t.tipo)}</span></div>`;
  })() : ''}

  <div class="grid2" style="margin-bottom:6px">
    <div class="field">
      <label>Via Aérea</label>
      <span>${b.viaAereaIntraop ? (() => {
        const v = b.viaAereaIntraop as any;
        if (v.tipo === 'canula_nasal') return 'Cânula Nasal';
        if (v.tipo === 'mascara_laringea') return `Máscara Laríngea nº ${fmt(v.numero)}`;
        if (v.tipo === 'tet') return `TET nº ${fmt(v.numero)}`;
        return '';
      })() : ''}</span>
    </div>
    <div class="field">
      <label>Punções</label>
      <span>${(b.puncoes as any)?.venosa ? `Venosa: ${(b.puncoes as any).venosa}` : ''}${(b.puncoes as any)?.arterial ? ` | Arterial: ${(b.puncoes as any).arterial}` : ''}</span>
    </div>
  </div>

  ${b.medicacoesIntraop ? `<div class="field" style="margin-bottom:6px"><label>Medicações Utilizadas</label><span style="white-space:pre-wrap">${b.medicacoesIntraop}</span></div>` : ''}

  ${b.sinaisVitais && (b.sinaisVitais as any[]).length > 0 ? `
  <div class="section-title">SINAIS VITAIS INTRAOPERATÓRIOS</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:6px;font-size:9px">
    <thead><tr style="background:#1a56a0;color:white">
      <th style="padding:3px 6px">Hora</th><th style="padding:3px 6px">PA</th><th style="padding:3px 6px">FC</th><th style="padding:3px 6px">SpO₂</th><th style="padding:3px 6px">EtCO₂</th>
    </tr></thead>
    <tbody>${(b.sinaisVitais as any[]).map((s,i) => `
      <tr style="background:${i%2===0?'#f9f9f9':'white'}">
        <td style="padding:3px 6px;text-align:center">${fmt(s.hora)}</td>
        <td style="padding:3px 6px;text-align:center">${fmt(s.pa)}</td>
        <td style="padding:3px 6px;text-align:center">${fmt(s.fc)}</td>
        <td style="padding:3px 6px;text-align:center">${fmt(s.spo2)}</td>
        <td style="padding:3px 6px;text-align:center">${fmt(s.etco2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}

  <div class="section-title">ALTA ANESTÉSICA</div>
  <div class="grid2" style="margin-bottom:6px">
    <div>
      <div class="field" style="margin-bottom:4px"><label>Destino</label>
        <span>${b.altaAnestesica ? (() => { const d = (b.altaAnestesica as any); const m: Record<string,string> = {srpa:'SRPA',uti:'UTI',enfermaria:'Enfermaria',domicilio:'Domicílio',outro:d.destinoOutro||'Outro'}; return m[d.destino]||''; })() : ''}</span>
      </div>
      <div class="field"><label>Condições na Alta</label><span>
        ${b.altaAnestesica ? Object.entries(b.altaAnestesica as Record<string,unknown>)
          .filter(([k,v]) => ['consciente','orientado','semDor','hemodinamicamenteEstavel','respirandoEspontaneamente','saturacaoAdequada'].includes(k) && v)
          .map(([k]) => {const m: Record<string,string>={consciente:'Consciente',orientado:'Orientado',semDor:'Sem Dor',hemodinamicamenteEstavel:'Hemodin. estável',respirandoEspontaneamente:'Resp. espontânea',saturacaoAdequada:'SatO₂ adequada'}; return m[k];}).join(' | ')
        : ''}
      </span></div>
      ${(b.altaAnestesica as any)?.observacoes ? `<div class="field" style="margin-top:3px"><label>Observações Alta</label><span>${(b.altaAnestesica as any).observacoes}</span></div>` : ''}
    </div>
    <div>
      <div class="section-title" style="margin-top:0;margin-bottom:4px">BALANÇO HÍDRICO</div>
      ${[['SRL',(b.fluidos as any)?.srl],['SF 0,9%',(b.fluidos as any)?.sf09],['Ringer Lactato',(b.fluidos as any)?.ringerlactato],['Outro',(b.fluidos as any)?.outro]].filter(([,v])=>v).map(([l,v])=>`<div class="field" style="margin-bottom:3px"><label>${l}</label><span>${fmt(v)} ml</span></div>`).join('')}
      <div class="field" style="background:#e8f0fe;margin-bottom:3px"><label>TOTAL FLUIDOS</label><span style="font-weight:bold">${fmt((b.fluidos as any)?.total) || (() => { const vals=[
        (b.fluidos as any)?.srl,(b.fluidos as any)?.sf09,(b.fluidos as any)?.ringerlactato,(b.fluidos as any)?.outro
      ].map((v:string)=>parseFloat(v||'0')).filter((n:number)=>!isNaN(n)); return vals.reduce((a:number,b:number)=>a+b,0)||''; })()} ml</span></div>
      <div class="field" style="margin-bottom:3px"><label>Diurese</label><span>${fmt(b.diurese)} ml</span></div>
      <div class="field"><label>Sangue</label><span>${fmt(b.sangue)} ml</span></div>
    </div>
  </div>

  <div class="footer">Gerado pelo AnestésioApp &nbsp;|&nbsp; ${new Date().toLocaleString('pt-BR')}</div>
</body></html>`;
}

function calcIdade(dataNasc: string | Date): string {
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  const anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  const idade = m < 0 || (m === 0 && hoje.getDate() < nasc.getDate()) ? anos - 1 : anos;
  return `${idade} anos`;
}
