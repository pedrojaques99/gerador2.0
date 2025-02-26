// Variáveis globais
let currentPdf = null;
let zoomLevel = 100;
let isBold = false;

// Elementos do DOM
const pdfViewer = document.getElementById('pdfViewer');
const pdfUpload = document.getElementById('pdfUpload');
const loadPdfBtn = document.getElementById('loadPdfBtn');
const zoomControl = document.getElementById('zoomControl');
const fontFamily = document.getElementById('fontFamily');
const fontSize = document.getElementById('fontSize');
const textColor = document.getElementById('textColor');
const boldToggle = document.getElementById('boldToggle');

// Toggle negrito
boldToggle.addEventListener('click', () => {
    isBold = !isBold;
    boldToggle.classList.toggle('active');
});

// Carregar PDF
loadPdfBtn.addEventListener('click', async () => {
    const file = pdfUpload.files[0];
    if (!file) {
        alert('Por favor, selecione um arquivo PDF');
        return;
    }

    try {
        pdfViewer.innerHTML = '<div class="loading">Carregando PDF...</div>';
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        currentPdf = await loadingTask.promise;
        await renderPage(1);
    } catch (error) {
        console.error('Erro ao carregar PDF:', error);
        pdfViewer.innerHTML = '<div class="error">Erro ao carregar PDF</div>';
    }
});

// Renderizar página do PDF
async function renderPage(pageNumber) {
    if (!currentPdf) return;

    try {
        const page = await currentPdf.getPage(pageNumber);
        const scale = zoomLevel / 100;
        const viewport = page.getViewport({ scale: 1.5 * scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        pdfViewer.innerHTML = '';
        const pdfPage = document.createElement('div');
        pdfPage.className = 'pdf-page';
        pdfPage.appendChild(canvas);
        pdfViewer.appendChild(pdfPage);

        await page.render(renderContext).promise;
    } catch (error) {
        console.error('Erro ao renderizar página:', error);
        pdfViewer.innerHTML = '<div class="error">Erro ao renderizar página</div>';
    }
}

// Controle de zoom
zoomControl.addEventListener('input', function() {
    zoomLevel = parseInt(this.value);
    document.getElementById('zoomValue').textContent = `${zoomLevel}%`;
    if (currentPdf) {
        renderPage(1);
    }
});

// Função para tornar elementos arrastáveis
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.className === 'remove-field') return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Adicionar novo serviço
const servicosContainer = document.getElementById('servicosContainer');
const addServicoBtn = document.getElementById('addServico');
let servicoCount = 1;

addServicoBtn.addEventListener('click', () => {
    servicoCount++;
    const servicoItem = document.createElement('div');
    servicoItem.className = 'servico-item';
    servicoItem.innerHTML = `
        <div class="servico-header">
            <h3>Serviço ${servicoCount}</h3>
            <button type="button" class="btn remove-servico">Remover</button>
        </div>
        <div class="input-with-button">
            <div class="form-group">
                <label>Nome do Serviço</label>
                <input type="text" class="servico-nome" required>
            </div>
            <button type="button" class="add-field-btn" data-field="servico_${servicoCount}_nome">
                <i>+</i>
            </button>
        </div>
        <div class="input-with-button">
            <div class="form-group">
                <label>Descrição</label>
                <textarea class="servico-descricao" rows="2" required></textarea>
            </div>
            <button type="button" class="add-field-btn" data-field="servico_${servicoCount}_descricao">
                <i>+</i>
            </button>
        </div>
        <div class="input-with-button">
            <div class="form-group">
                <label>Valor</label>
                <input type="number" class="servico-valor" step="0.01" required>
            </div>
            <button type="button" class="add-field-btn" data-field="servico_${servicoCount}_valor">
                <i>+</i>
            </button>
        </div>
    `;
    servicosContainer.appendChild(servicoItem);
    initializeFieldButtons();

    servicoItem.querySelector('.remove-servico').addEventListener('click', () => {
        servicoItem.remove();
        const servicos = document.querySelectorAll('.servico-item');
        servicos.forEach((servico, index) => {
            const numero = index + 1;
            servico.querySelector('h3').textContent = `Serviço ${numero}`;
            
            servico.querySelectorAll('.add-field-btn').forEach(btn => {
                const [prefix, _, tipo] = btn.dataset.field.split('_');
                btn.dataset.field = `servico_${numero}_${tipo}`;
            });
        });
        servicoCount = servicos.length;
    });
});

// Adicionar função para atualizar opções do select
function updateFieldTypeOptions() {
    const optgroup = fieldType.querySelector('optgroup[label="Serviços"]');
    optgroup.innerHTML = '';
    
    for (let i = 1; i <= servicoCount; i++) {
        optgroup.innerHTML += `
            <option value="servico_${i}_nome">Serviço ${i} - Nome</option>
            <option value="servico_${i}_descricao">Serviço ${i} - Descrição</option>
            <option value="servico_${i}_valor">Serviço ${i} - Valor</option>
        `;
    }
}

// Modificar a função de geração do PDF
const orcamentoForm = document.getElementById('orcamentoForm');
orcamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentPdf) {
        alert('Por favor, carregue um PDF primeiro');
        return;
    }

    try {
        const formData = {
            cliente: document.getElementById('cliente').value,
            data: document.getElementById('data').value,
            prazo: document.getElementById('prazo').value,
            servicos: Array.from(document.querySelectorAll('.servico-item')).map(item => ({
                nome: item.querySelector('.servico-nome').value,
                descricao: item.querySelector('.servico-descricao').value,
                valor: item.querySelector('.servico-valor').value
            }))
        };

        // Obter os bytes do PDF atual
        const pdfBytes = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.readAsArrayBuffer(pdfUpload.files[0]);
        });

        // Carregar o PDF com PDF-Lib
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Processar cada campo de texto
        const textFields = document.querySelectorAll('.text-field-marker');
        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        
        for (const field of textFields) {
            const fieldType = field.getAttribute('data-field-type');
            const rect = field.getBoundingClientRect();
            const pdfRect = convertToPdfCoordinates(rect, firstPage);
            const fontSize = parseInt(field.getAttribute('data-font-size'));
            const color = field.getAttribute('data-text-color');
            const isBold = field.getAttribute('data-font-bold') === 'true';
            
            // Converter cor hex para RGB
            const rgbColor = hexToRGBForPDF(color);
            
            let text = '';
            if (fieldType === 'cliente') {
                text = formData.cliente;
            } else if (fieldType === 'data') {
                text = formData.data;
            } else if (fieldType === 'prazo') {
                text = formData.prazo;
            } else if (fieldType.startsWith('servico_')) {
                const [_, servicoNum, campo] = fieldType.split('_');
                const servicoIndex = parseInt(servicoNum) - 1;
                const servico = formData.servicos[servicoIndex];
                
                if (servico) {
                    switch(campo) {
                        case 'nome':
                            text = servico.nome;
                            break;
                        case 'descricao':
                            text = servico.descricao;
                            break;
                        case 'valor':
                            text = new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(servico.valor);
                            break;
                    }
                }
            }

            if (text) {
                firstPage.drawText(text, {
                    x: pdfRect.x,
                    y: pdfRect.y,
                    size: fontSize,
                    font: font,
                    color: rgbColor
                });
            }
        }

        // Salvar e fazer download do PDF
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orcamento_${formData.cliente}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar o orçamento: ' + error.message);
    }
});

// Função auxiliar para converter coordenadas
function convertToPdfCoordinates(rect, page) {
    const pdfPage = document.querySelector('.pdf-page');
    const canvas = pdfPage.querySelector('canvas');
    
    const zoom = parseFloat(zoomControl.value) / 100;
    const scale = page.getWidth() / canvas.width;
    const pdfPageRect = pdfPage.getBoundingClientRect();
    
    return {
        x: ((rect.left - pdfPageRect.left) / zoom) * scale,
        y: page.getHeight() - (((rect.top - pdfPageRect.top) / zoom) * scale)
    };
}

// Função auxiliar para converter cor hex para RGB para o PDF-Lib
function hexToRGBForPDF(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return PDFLib.rgb(r, g, b);
}

// Modificar o JavaScript para usar os novos botões
function initializeFieldButtons() {
    document.querySelectorAll('.add-field-btn').forEach(button => {
        button.addEventListener('click', function() {
            const fieldType = this.dataset.field;
            const fieldLabel = this.parentElement.querySelector('label').textContent;
            
            const pdfPage = document.querySelector('.pdf-page');
            if (!pdfPage) {
                alert('Por favor, carregue um PDF primeiro');
                return;
            }

            addTextFieldToPdf(fieldType, fieldLabel);
        });
    });
}

// Inicializar os botões existentes
initializeFieldButtons();

function addTextFieldToPdf(fieldType, fieldLabel) {
    const pdfPage = document.querySelector('.pdf-page');
    
    const textField = document.createElement('div');
    textField.className = 'text-field-marker';
    
    const textContent = document.createElement('span');
    textContent.textContent = fieldLabel;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-field';
    removeButton.innerHTML = '×';
    removeButton.onclick = (e) => {
        e.stopPropagation();
        textField.remove();
    };

    textField.appendChild(textContent);
    textField.appendChild(removeButton);
    
    textField.setAttribute('data-field-type', fieldType);
    textField.setAttribute('data-font-family', fontFamily.value);
    textField.setAttribute('data-font-size', fontSize.value);
    textField.setAttribute('data-font-bold', isBold);
    textField.setAttribute('data-text-color', textColor.value);
    
    textField.style.color = textColor.value;
    textField.style.fontFamily = fontFamily.value;
    textField.style.fontSize = fontSize.value + 'px';
    textField.style.fontWeight = isBold ? 'bold' : 'normal';
    textField.style.position = 'absolute';
    textField.style.left = '50px';
    textField.style.top = '50px';
    textField.style.zIndex = '100';
    
    pdfPage.appendChild(textField);
    makeDraggable(textField);
}

// Adicionar listeners para atualização em tempo real
[fontFamily, fontSize, textColor].forEach(control => {
    control.addEventListener('change', updateSelectedFieldStyles);
    control.addEventListener('input', updateSelectedFieldStyles);
});

function updateSelectedFieldStyles() {
    const fields = document.querySelectorAll('.text-field-marker');
    fields.forEach(field => {
        field.style.fontFamily = fontFamily.value;
        field.style.fontSize = fontSize.value + 'px';
        field.style.color = textColor.value;
        
        field.setAttribute('data-font-family', fontFamily.value);
        field.setAttribute('data-font-size', fontSize.value);
        field.setAttribute('data-text-color', textColor.value);
    });
}

// Definir a cor padrão ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const textColor = document.getElementById('textColor');
    textColor.value = '#d1d1d1';
});

// Adicione ao final do arquivo
async function carregarOrcamentosSalvos() {
    try {
        const orcamentos = await listarOrcamentos();
        const lista = document.getElementById('listaOrcamentos');
        
        lista.innerHTML = orcamentos.map(orc => `
            <div class="orcamento-item">
                <h3>${orc.cliente}</h3>
                <p>Data: ${new Date(orc.data).toLocaleDateString()}</p>
                <p>Valor Total: ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(orc.valor_total)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
    }
}

// Carregar orçamentos ao iniciar a página
document.addEventListener('DOMContentLoaded', carregarOrcamentosSalvos);
