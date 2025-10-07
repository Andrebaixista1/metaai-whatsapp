// Utilitário para processamento de arquivos CSV
export const processCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter(line => line.trim() !== '')
        
        if (lines.length < 2) {
          reject(new Error('Arquivo CSV deve conter pelo menos o cabeçalho e uma linha de dados'))
          return
        }
        
        // Processar cabeçalho
        const headers = lines[0].split(';').map(header => header.trim().toLowerCase())
        
        // Verificar se as colunas obrigatórias existem
        const requiredColumns = ['name', 'phone'] // email é opcional
        const optionalColumns = ['email']
        const missingColumns = requiredColumns.filter(col => !headers.includes(col))
        
        if (missingColumns.length > 0) {
          reject(new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}\nColunas obrigatórias: name, phone\nColuna opcional: email`))
          return
        }
        
        // Processar dados
        const data = []
        const nameIndex = headers.indexOf('name')
        const phoneIndex = headers.indexOf('phone')
        const emailIndex = headers.indexOf('email') // Pode ser -1 se não existir
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line === '') continue
          
          const columns = line.split(';').map(col => col.trim())
          
          // Verificar se a linha tem o número correto de colunas
          if (columns.length < headers.length) {
            console.warn(`Linha ${i + 1} ignorada: número insuficiente de colunas`)
            continue
          }
          
          const name = columns[nameIndex] || ''
          const phone = columns[phoneIndex] || ''
          const email = emailIndex >= 0 ? (columns[emailIndex] || '') : '' // Verifica se coluna email existe
          
          // Validar dados obrigatórios
          if (!name || !phone) {
            console.warn(`Linha ${i + 1} ignorada: nome ou telefone vazio`)
            continue
          }
          
          // Validar formato do telefone
          let formattedPhone
          try {
            formattedPhone = formatPhone(phone)
          } catch (phoneError) {
            console.warn(`Linha ${i + 1} ignorada: ${phoneError.message}`)
            continue
          }
          
          // Validar email (opcional) - só valida se não estiver vazio
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (email && !emailRegex.test(email)) {
            console.warn(`Linha ${i + 1}: email inválido (${email}), mas linha será mantida`)
          }
          
          data.push({
            name: name,
            phone: formattedPhone,
            email: email || null // Permite null se não informado
          })
        }
        
        if (data.length === 0) {
          reject(new Error('Nenhum dado válido encontrado no arquivo CSV'))
          return
        }
        
        // Adicionar estatísticas do processamento
        const stats = {
          totalLines: lines.length - 1, // Excluindo cabeçalho
          validContacts: data.length,
          invalidContacts: (lines.length - 1) - data.length
        }
        
        resolve({ data, stats })
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo CSV: ${error.message}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'))
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

// Formatar telefone para padrão brasileiro
const formatPhone = (phone) => {
  // Remove tudo que não é número
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Validações de tamanho
  if (cleanPhone.length < 10) {
    throw new Error(`Telefone muito curto: ${phone}`)
  }
  
  if (cleanPhone.length > 15) {
    throw new Error(`Telefone muito longo: ${phone}`)
  }
  
  // Se tem 10 ou 11 dígitos (telefone brasileiro sem código do país)
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    return `+55${cleanPhone}`
  }
  
  // Se tem 12 ou 13 dígitos e começa com 55 (código do Brasil)
  if ((cleanPhone.length === 12 || cleanPhone.length === 13) && cleanPhone.startsWith('55')) {
    return `+${cleanPhone}`
  }
  
  // Se já tem + no início, manter como está
  if (phone.startsWith('+')) {
    const cleanWithPlus = phone.replace(/[^+\d]/g, '')
    if (cleanWithPlus.length >= 11) {
      return cleanWithPlus
    }
  }
  
  // Caso padrão: adicionar +55 se o número parece brasileiro
  if (cleanPhone.length >= 10) {
    return `+55${cleanPhone}`
  }
  
  throw new Error(`Formato de telefone não reconhecido: ${phone}`)
}

// Validar estrutura do CSV
export const validateCsvStructure = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const firstLine = text.split('\n')[0]
        const headers = firstLine.split(';').map(header => header.trim().toLowerCase())
        
        const requiredColumns = ['name', 'phone'] // email é opcional
        const hasAllColumns = requiredColumns.every(col => headers.includes(col))
        
        if (hasAllColumns) {
          resolve(true)
        } else {
          const missingColumns = requiredColumns.filter(col => !headers.includes(col))
          reject(new Error(`Estrutura inválida. Colunas obrigatórias: name;phone\nColuna opcional: email\nColunas não encontradas: ${missingColumns.join(', ')}`))
        }
      } catch (error) {
        reject(new Error('Erro ao validar estrutura do arquivo'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'))
    }
    
    // Ler apenas os primeiros 500 caracteres para validação rápida
    const blob = file.slice(0, 500)
    reader.readAsText(blob, 'UTF-8')
  })
}

// Gerar CSV de exemplo
export const generateSampleCsv = () => {
  const sampleData = [
    'name;phone;email',
    'João Silva;11999999999;joao@email.com',
    'Maria Santos;(11) 88888-8888;maria@email.com',
    'Pedro Oliveira;+5511777777777;', // Sem email
    'Ana Costa;11 66666-6666;ana@email.com',
    'Carlos Ferreira;11955555555;', // Sem email
    'Fernanda Lima;21987654321;fernanda@email.com',
    'Roberto Souza;11944444444;', // Sem email
    'Juliana Pereira;11933333333;juliana@email.com',
    'Marcos Almeida;11922222222;',  // Sem email
    'Camila Rocha;11911111111;camila@email.com'
  ]
  
  const csvContent = sampleData.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Criar link para download
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'exemplo-contatos.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100)
}