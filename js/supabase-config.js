// Substitua com suas credenciais do Supabase
const supabaseUrl = 'https://nxurkygntxqyawdfrfag.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dXJreWdudHhxeWF3ZGZyZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NzkxNDMsImV4cCI6MjA1NjE1NTE0M30.YBfIHIcHXDq65PBbOnajaKVEjRYDjQPZ_8Be2foMsqc'

// Inicializar o cliente Supabase
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

// Função para salvar orçamento
async function salvarOrcamento(dados) {
    try {
        const { data, error } = await supabase
            .from('orcamentos')
            .insert([
                {
                    cliente: dados.cliente,
                    data: dados.data,
                    prazo: dados.prazo,
                    servicos: dados.servicos,
                    valor_total: dados.servicos.reduce((total, servico) => total + Number(servico.valor), 0)
                }
            ])
            .select()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Erro ao salvar orçamento:', error)
        throw error
    }
}

// Função para listar orçamentos
async function listarOrcamentos() {
    try {
        const { data, error } = await supabase
            .from('orcamentos')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Erro ao listar orçamentos:', error)
        throw error
    }
}

// Exportar funções
window.salvarOrcamento = salvarOrcamento;
window.listarOrcamentos = listarOrcamentos; 
