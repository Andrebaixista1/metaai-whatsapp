import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, ProgressBar } from 'react-bootstrap'
import { Upload, Users, MessageSquare, Calendar, Clock, FileText, Send, Download, AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { processCsvFile, validateCsvStructure, generateSampleCsv } from '../utils/csvUtils'
import CsvFormatInfo from '../components/CsvFormatInfo'

function Dispatch() {
  const [csvFile, setCsvFile] = useState(null)
  const [csvData, setCsvData] = useState([])
  const [csvStats, setCsvStats] = useState(null)
  const [csvError, setCsvError] = useState('')
  const [channels, setChannels] = useState([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false) // Switch para modo teste
  const [testContact, setTestContact] = useState({ name: '', phone: '', email: '' }) // Contato teste
  const [formData, setFormData] = useState({
    name: '',
    channel: '',
    template: '',
    scheduledDateTime: '',
    intervalMin: 15,
    intervalMax: 30
  })
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [processingCsv, setProcessingCsv] = useState(false)

  // Função para exibir o status com primeira letra maiúscula
  const getStatusText = (status) => {
    if (!status) return 'Indefinido'
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  // Função para determinar a classe do badge customizado baseada no status
  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'connected':
        return 'badge badge-connected'
      case 'flagged':
        return 'badge badge-flagged'
      default:
        return 'badge bg-secondary'
    }
  }

  // Função para traduzir quality_rating
  const getQualityText = (rating) => {
    switch(rating?.toLowerCase()) {
      case 'green':
        return 'High'
      case 'red':
        return 'Low'
      default:
        return 'Indefinido'
    }
  }

  // Função para traduzir status do template
  const getTemplateStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
        return 'Aprovado'
      case 'pending':
        return 'Pendente'
      case 'rejected':
        return 'Rejeitado'
      case 'disabled':
        return 'Desabilitado'
      default:
        return 'Indefinido'
    }
  }

  // Função para traduzir category do template
  const getTemplateCategoryText = (category) => {
    switch(category?.toLowerCase()) {
      case 'marketing':
        return 'Marketing'
      case 'utility':
        return 'Utilidade'
      case 'authentication':
        return 'Autenticação'
      case 'transactional':
        return 'Transacional'
      case 'promotional':
        return 'Promocional'
      case 'informational':
        return 'Informativo'
      default:
        return category || 'Indefinido'
    }
  }

  // Função para determinar a cor baseada no quality_rating
  const getQualityColor = (rating) => {
    switch(rating?.toLowerCase()) {
      case 'green':
        return '#28a745' // Verde
      case 'yellow':
        return '#ffc107' // Amarelo
      case 'red':
        return '#dc3545' // Vermelho
      case 'orange':
        return '#fd7e14' // Laranja
      default:
        return '#6c757d' // Cinza para indefinido
    }
  }
  const fetchChannels = async () => {
    setLoadingChannels(true)
    try {
      const response = await fetch('https://webhook.sistemavieira.com.br/webhook/canais')
      if (response.ok) {
        const data = await response.json()
        setChannels(data)
      } else {
        console.error('Erro ao buscar canais:', response.statusText)
        // Fallback para dados mockados em caso de erro
        setChannels(mockChannels)
      }
    } catch (error) {
      console.error('Erro ao conectar com a API:', error)
      // Fallback para dados mockados em caso de erro
      setChannels(mockChannels)
    } finally {
      setLoadingChannels(false)
    }
  }

  // Buscar templates da API baseado no canal selecionado
  const fetchTemplatesByChannel = async (accountId) => {
    if (!accountId) {
      setTemplates([])
      return
    }
    
    console.log('Buscando templates para canal:', accountId) // Debug
    setLoadingTemplates(true)
    
    try {
      const response = await fetch('https://webhook.sistemavieira.com.br/webhook/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_account: accountId })
      })
      
      console.log('Response status:', response.status) // Debug
      
      if (response.ok) {
        const data = await response.json()
        console.log('Templates recebidos:', data) // Debug
        
        // A resposta pode vir em diferentes formatos, vamos verificar
        if (Array.isArray(data)) {
          setTemplates(data)
        } else if (data && Array.isArray(data.data)) {
          setTemplates(data.data)
        } else if (data && data.body && Array.isArray(data.body)) {
          setTemplates(data.body)
        } else {
          console.log('Formato de resposta não reconhecido:', data)
          setTemplates([])
        }
      } else {
        const errorText = await response.text()
        console.error('Erro ao buscar templates:', response.status, response.statusText, errorText)
        // Fallback para dados mockados em caso de erro
        setTemplates(mockTemplates)
      }
    } catch (error) {
      console.error('Erro ao conectar com a API de templates:', error)
      // Fallback para dados mockados em caso de erro
      setTemplates(mockTemplates)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Buscar templates da API (função original - mantida para compatibilidade)
  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await fetch('https://webhook.sistemavieira.com.br/webhook/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      } else {
        console.error('Erro ao buscar templates:', response.statusText)
        // Fallback para dados mockados em caso de erro
        setTemplates(mockTemplates)
      }
    } catch (error) {
      console.error('Erro ao conectar com a API de templates:', error)
      // Fallback para dados mockados em caso de erro
      setTemplates(mockTemplates)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Carregar apenas canais ao montar o componente
  useEffect(() => {
    fetchChannels()
    // Não carregar templates automaticamente - agora são carregados por canal
    
    // Definir data e hora atual + 10 minutos como padrão (horário local)
    const now = new Date()
    // Adicionar 10 minutos ao horário atual
    now.setMinutes(now.getMinutes() + 10)
    // Formato para datetime-local (sem ajuste de timezone)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
    
    setFormData(prev => ({
      ...prev,
      scheduledDateTime: defaultDateTime
    }))
  }, [])

  // Dados mockados
  const mockChannels = [
    { id: 1, name: 'Canal Principal', phone: '+55 11 99999-9999' },
    { id: 2, name: 'Canal Marketing', phone: '+55 11 88888-8888' },
    { id: 3, name: 'Canal Cobrança', phone: '+55 11 77777-7777' }
  ]

  const mockTemplates = [
    { record_id: 1, name: 'Promoção Black Friday', category: 'Marketing' },
    { record_id: 2, name: 'Lembrete Vencimento', category: 'Cobrança' },
    { record_id: 3, name: 'Newsletter Template', category: 'Informativo' },
    { record_id: 4, name: 'Boas Vindas', category: 'Onboarding' }
  ]

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Reset states
    setCsvError('')
    setCsvData([])
    setCsvStats(null)
    setUploadProgress(0)
    
    // Verificar se é CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Por favor, selecione um arquivo CSV válido')
      return
    }
    
    setCsvFile(file)
    setProcessingCsv(true)
    
    try {
      // Validar estrutura primeiro
      setUploadProgress(20)
      await validateCsvStructure(file)
      
      // Processar arquivo
      setUploadProgress(50)
      const result = await processCsvFile(file)
      
      setUploadProgress(100)
      setCsvData(result.data)
      setCsvStats(result.stats)
      
      setTimeout(() => {
        setProcessingCsv(false)
        setUploadProgress(0)
      }, 500)
      
    } catch (error) {
      setCsvError(error.message)
      setCsvFile(null)
      setCsvData([])
      setCsvStats(null)
      setProcessingCsv(false)
      setUploadProgress(0)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Se o canal foi alterado, buscar templates específicos
    if (name === 'channel' && value) {
      console.log('Canal selecionado:', value) // Debug
      
      // Encontrar o canal selecionado para pegar o id_account
      const selectedChannel = channels.find(channel => 
        `${channel.account_name} - ${channel.display_phone_number}`.toUpperCase() === value
      )
      
      console.log('Canal encontrado:', selectedChannel) // Debug
      
      if (selectedChannel && selectedChannel.id_account) {
        console.log('ID Account encontrado:', selectedChannel.id_account) // Debug
        
        // Limpar template selecionado quando trocar de canal
        setFormData(prev => ({
          ...prev,
          [name]: value,
          template: '' // Limpar template ao trocar canal
        }))
        
        // Buscar templates para o canal selecionado
        fetchTemplatesByChannel(selectedChannel.id_account)
      } else {
        console.log('Canal não encontrado ou sem id_account') // Debug
      }
    }
  }

  const handleTestContactChange = (e) => {
    setTestContact({
      ...testContact,
      [e.target.name]: e.target.value
    })
  }

  const handleModeToggle = () => {
    setIsTestMode(!isTestMode)
    // Limpar dados do CSV quando trocar para modo teste
    if (!isTestMode) {
      setCsvFile(null)
      setCsvData([])
      setCsvStats(null)
      setCsvError('')
    }
    // Limpar dados do teste quando trocar para modo CSV
    if (isTestMode) {
      setTestContact({ name: '', phone: '', email: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Encontrar o canal selecionado para pegar o phone_id
      const selectedChannel = channels.find(channel => 
        `${channel.account_name} - ${channel.display_phone_number}`.toUpperCase() === formData.channel
      )
      
      if (!selectedChannel) {
        alert('Canal não encontrado. Selecione um canal válido.')
        setLoading(false)
        return
      }
      
      let response
      
      if (isTestMode) {
        // Modo teste: enviar como JSON
        const dispatchData = {
          name: formData.name,
          channel: formData.channel,
          phone_id: selectedChannel.phone_id,
          display_phone_number: selectedChannel.display_phone_number,
          template: templates.find(t => t.name.toUpperCase() === formData.template)?.name || formData.template,
          scheduledDateTime: new Date(formData.scheduledDateTime).toISOString().slice(0, 16).replace('T', ' '),
          intMin: formData.intervalMin,
          intMax: formData.intervalMax,
          mode: 'test',
          contacts: {
            name: testContact.name,
            phone: testContact.phone.replace(/[^0-9]/g, ''),
            email: testContact.email || null
          }
        }
        
        console.log('Dados para envio (teste):', dispatchData)
        
        response = await fetch('https://n8n.sistemavieira.com.br/webhook-test/envio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dispatchData)
        })
      } else {
        // Modo CSV: enviar como FormData
        const formData_upload = new FormData()
        formData_upload.append('name', formData.name)
        formData_upload.append('channel', formData.channel)
        formData_upload.append('phone_id', selectedChannel.phone_id)
        formData_upload.append('display_phone_number', selectedChannel.display_phone_number)
        formData_upload.append('template', templates.find(t => t.name.toUpperCase() === formData.template)?.name || formData.template)
        formData_upload.append('scheduledDateTime', new Date(formData.scheduledDateTime).toISOString().slice(0, 16).replace('T', ' '))
        formData_upload.append('intMin', formData.intervalMin)
        formData_upload.append('intMax', formData.intervalMax)
        formData_upload.append('mode', 'csv')
        formData_upload.append('csvFile', csvFile) // Arquivo como binary
        formData_upload.append('contactCount', csvData.length)
        
        console.log('Dados para envio (CSV):', {
          name: formData.name,
          channel: formData.channel,
          phone_id: selectedChannel.phone_id,
          display_phone_number: selectedChannel.display_phone_number,
          template: templates.find(t => t.name.toUpperCase() === formData.template)?.name || formData.template,
          csvFileName: csvFile.name,
          contactCount: csvData.length
        })
        
        response = await fetch('https://n8n.sistemavieira.com.br/webhook-test/envio', {
          method: 'POST',
          body: formData_upload // Sem Content-Type header para FormData
        })
      }
      
      if (response.ok) {
        const result = await response.json()
        console.log('Resposta da API:', result)
        setLoading(false)
        setShowSuccess(true)
        
        // Reset form after success
        setTimeout(() => {
          setShowSuccess(false)
          setCsvFile(null)
          setCsvData([])
          setCsvStats(null)
          setFormData({
            name: '',
            channel: '',
            template: '',
            scheduledDateTime: '',
            intervalMin: 15,
            intervalMax: 30
          })
          setTestContact({ name: '', phone: '', email: '' })
          setUploadProgress(0)
        }, 3000)
      } else {
        const errorText = await response.text()
        console.error('Erro no envio:', response.status, response.statusText, errorText)
        setLoading(false)
        alert('Erro ao enviar disparo. Verifique o console para mais detalhes.')
      }
    } catch (error) {
      console.error('Erro ao conectar com a API de envio:', error)
      setLoading(false)
      alert('Erro de conexão. Verifique sua internet e tente novamente.')
    }
  }

  const isFormValid = () => {
    const baseValid = formData.name && 
                     formData.channel && 
                     formData.template && 
                     formData.scheduledDateTime
    
    if (isTestMode) {
      // Modo teste: precisa do contato teste
      return baseValid && testContact.name && testContact.phone
    } else {
      // Modo CSV: precisa do arquivo CSV
      return baseValid && csvData.length > 0
    }
  }

  return (
    <div className="dispatch-page">
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center mb-3">
              <Button 
                as={Link} 
                to="/dashboard" 
                variant="outline-secondary" 
                size="sm" 
                className="me-3"
              >
                <ArrowLeft size={16} className="me-1" />
                Voltar
              </Button>
              <div>
                <h1 className="h3 fw-bold mb-1">Novo Disparo</h1>
                <p className="text-muted mb-0">Configure e agende um novo disparo em massa</p>
              </div>
            </div>
            
            {/* Switch para alternar entre modo CSV e Teste */}
            <Card className="mb-4">
              <Card.Body className="py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1 fw-bold">
                      {isTestMode ? 'Modo: Disparo Teste Individual' : 'Modo: Upload de Contatos (Massa)'}
                    </h6>
                    <small className="text-muted">
                      {isTestMode 
                        ? 'Envie uma mensagem de teste para um contato específico' 
                        : 'Carregue um arquivo CSV para disparos em massa'
                      }
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="modeSwitch"
                      checked={isTestMode}
                      onChange={handleModeToggle}
                    />
                    <label className="form-check-label" htmlFor="modeSwitch">
                      {isTestMode ? 'Teste Individual' : 'Upload CSV'}
                    </label>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {showSuccess && (
          <Alert variant="success" className="mb-4">
            <MessageSquare size={20} className="me-2" />
            Disparo criado com sucesso! Ele será executado na data e hora agendadas.
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Configuração do Disparo */}
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="fw-bold mb-0">
                    <FileText size={20} className="me-2" />
                    Configuração do Disparo
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Nome da Campanha</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Ex: Promoção Black Friday"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Canal WhatsApp</Form.Label>
                        <div className="custom-select-wrapper">
                          <Form.Select
                            name="channel"
                            value={formData.channel}
                            onChange={handleInputChange}
                            required
                            disabled={loadingChannels}
                          >
                            <option value="">
                              {loadingChannels ? 'Carregando canais...' : 'Selecione um canal'}
                            </option>
                            {channels.map(channel => {
                              const displayText = `${channel.account_name} - ${channel.display_phone_number}`.toUpperCase()
                              return (
                                <option key={channel.record_id} value={displayText}>
                                  {displayText}
                                </option>
                              )
                            })}
                          </Form.Select>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Template da Mensagem</Form.Label>
                        <Form.Select
                          name="template"
                          value={formData.template}
                          onChange={handleInputChange}
                          required
                          disabled={loadingTemplates || !formData.channel}
                        >
                          <option value="">
                            {!formData.channel 
                              ? 'Selecione um canal primeiro' 
                              : loadingTemplates 
                                ? 'Carregando templates...' 
                                : templates.length === 0
                                  ? 'Nenhum template disponível para este canal'
                                  : 'Selecione um template'
                            }
                          </option>
                          {templates.map(template => (
                            <option key={template.record_id} value={template.name.toUpperCase()}>
                              {template.name.toUpperCase()}
                            </option>
                          ))}
                        </Form.Select>
                        {formData.channel && !loadingTemplates && templates.length === 0 && (
                          <Form.Text className="text-warning">
                            Nenhum template encontrado para o canal selecionado. Verifique se o canal possui templates configurados.
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Data e Hora do Envio</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="scheduledDateTime"
                          value={formData.scheduledDateTime}
                          onChange={handleInputChange}
                          min={(() => {
                            const now = new Date()
                            now.setMinutes(now.getMinutes() + 1) // Pelo menos 1 minuto no futuro
                            const year = now.getFullYear()
                            const month = String(now.getMonth() + 1).padStart(2, '0')
                            const day = String(now.getDate()).padStart(2, '0')
                            const hours = String(now.getHours()).padStart(2, '0')
                            const minutes = String(now.getMinutes()).padStart(2, '0')
                            return `${year}-${month}-${day}T${hours}:${minutes}`
                          })()}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Intervalo de Disparos (aleatório)</Form.Label>
                        <div className="range-slider-container">
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={formData.intervalMin}
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value)
                              setFormData(prev => ({
                                ...prev,
                                intervalMin: newMin,
                                intervalMax: Math.max(newMin, prev.intervalMax)
                              }))
                            }}
                            className="range-slider range-min"
                            id="range-min"
                          />
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={formData.intervalMax}
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value)
                              setFormData(prev => ({
                                ...prev,
                                intervalMax: newMax,
                                intervalMin: Math.min(prev.intervalMin, newMax)
                              }))
                            }}
                            className="range-slider range-max"
                            id="range-max"
                          />
                          <div 
                            className="range-fill"
                            style={{
                              position: 'absolute',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              left: `${((formData.intervalMin - 1) / 59) * 100}%`,
                              width: `${((formData.intervalMax - formData.intervalMin) / 59) * 100}%`,
                              height: '6px',
                              background: '#007bff',
                              borderRadius: '3px',
                              zIndex: 2
                            }}
                          />
                          <div className="range-values">
                            <span className="range-value-min">{formData.intervalMin}s</span>
                            <span className="range-value-max">{formData.intervalMax}s</span>
                          </div>
                        </div>
                        <Form.Text className="text-muted">
                          Faixa de tempo para enviar para o próximo contato (aleatório)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Upload CSV ou Contato Teste */}
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">
                      {isTestMode ? (
                        <>
                          <Users size={20} className="me-2" />
                          Contato para Teste
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="me-2" />
                          Upload de Contatos (CSV)
                        </>
                      )}
                    </h5>
                    {!isTestMode && (
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        onClick={generateSampleCsv}
                        className="d-flex align-items-center"
                      >
                        <Download size={16} className="me-1" />
                        Baixar Exemplo
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  {isTestMode ? (
                    /* Formulário para contato teste */
                    <>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Nome do Contato</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={testContact.name}
                              onChange={handleTestContactChange}
                              placeholder="Ex: João Silva"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Telefone</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={testContact.phone}
                              onChange={handleTestContactChange}
                              placeholder="Ex: 11999999999"
                              required
                            />
                            <Form.Text className="text-muted">
                              Apenas números, sem código do país
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={12} className="mb-3">
                          <Form.Group>
                            <Form.Label>Email (opcional)</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={testContact.email}
                              onChange={handleTestContactChange}
                              placeholder="Ex: joao@email.com"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      {testContact.name && testContact.phone && (
                        <Alert variant="info">
                          <Users size={16} className="me-2" />
                          <strong>Contato de teste configurado!</strong>
                          <div className="mt-2 small">
                            <div>✅ Nome: {testContact.name}</div>
                            <div>✅ Telefone: {testContact.phone}</div>
                            {testContact.email && <div>✅ Email: {testContact.email}</div>}
                          </div>
                        </Alert>
                      )}
                    </>
                  ) : (
                    /* Formulário original do CSV */
                    <>
                      <CsvFormatInfo />

                      <Form.Group className="mb-3">
                        <Form.Label>Arquivo CSV</Form.Label>
                        <Form.Control
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          required
                          disabled={processingCsv}
                        />
                        <Form.Text className="text-muted">
                          <strong>Formato obrigatório:</strong> Separador por ponto e vírgula (;)<br />
                          <strong>Colunas obrigatórias:</strong> name;phone<br />
                          <strong>Coluna opcional:</strong> email<br />
                          <strong>Exemplo:</strong> João Silva;11999999999;joao@email.com
                        </Form.Text>
                      </Form.Group>

                      {csvError && (
                        <Alert variant="danger" className="mb-3">
                          <AlertCircle size={16} className="me-2" />
                          {csvError}
                        </Alert>
                      )}

                      {(processingCsv || uploadProgress > 0) && (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span>Processando arquivo...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <ProgressBar now={uploadProgress} animated />
                        </div>
                      )}

                      {csvData.length > 0 && (
                        <div>
                          <Alert variant="success">
                            <Users size={16} className="me-2" />
                            <strong>Processamento concluído!</strong>
                            {csvStats && (
                              <div className="mt-2 small">
                                <div>✅ {csvStats.validContacts} contatos válidos carregados</div>
                                {csvStats.invalidContacts > 0 && (
                                  <div>⚠️ {csvStats.invalidContacts} linhas ignoradas (dados inválidos)</div>
                                )}
                                <div>📊 Total de linhas processadas: {csvStats.totalLines}</div>
                              </div>
                            )}
                          </Alert>
                          
                          <div className="table-responsive">
                            <Table striped size="sm">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Nome</th>
                                  <th>Telefone</th>
                                  <th>Email</th>
                                </tr>
                              </thead>
                              <tbody>
                                {csvData.slice(0, 5).map((contact, index) => (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{contact.name}</td>
                                    <td>{contact.phone}</td>
                                    <td>
                                      {contact.email ? (
                                        contact.email
                                      ) : (
                                        <span className="text-muted fst-italic">Não informado</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                            {csvData.length > 5 && (
                              <p className="text-muted mb-0">
                                <strong>Mostrando 5 de {csvData.length} contatos.</strong> Todos serão processados no disparo.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Resumo */}
            <Col lg={4}>
              <Card className="sticky-top">
                <Card.Header>
                  <h5 className="fw-bold mb-0">
                    <MessageSquare size={20} className="me-2" />
                    Resumo do Disparo
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Campanha:</strong>
                    <p className="text-muted mb-0">
                      {formData.name || 'Não informado'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    {formData.channel ? (
                      <div className="p-3 border rounded bg-light">
                        <strong>Canal:</strong>
                        <p className="text-muted mb-2 mt-1">
                          {formData.channel}
                        </p>
                        <div className="d-flex align-items-center mb-2">
                          <strong className="me-2">Status:</strong>
                          <span 
                            className={getStatusBadgeClass(
                              channels.find(c => 
                                `${c.account_name} - ${c.display_phone_number}`.toUpperCase() === formData.channel
                              )?.status
                            )}
                          >
                            {getStatusText(
                              channels.find(c => 
                                `${c.account_name} - ${c.display_phone_number}`.toUpperCase() === formData.channel
                              )?.status
                            )}
                          </span>
                        </div>
                        
                        <div className="d-flex align-items-center">
                          <strong className="me-2">Quality rating:</strong>
                          <div 
                            className="me-2"
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: getQualityColor(
                                channels.find(c => 
                                  `${c.account_name} - ${c.display_phone_number}`.toUpperCase() === formData.channel
                                )?.quality_rating
                              ),
                              border: '1px solid rgba(0,0,0,0.2)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          />
                          <span className="text-muted">
                            {getQualityText(
                              channels.find(c => 
                                `${c.account_name} - ${c.display_phone_number}`.toUpperCase() === formData.channel
                              )?.quality_rating
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <strong>Canal:</strong>
                        <p className="text-muted mb-0 mt-1">
                          Não selecionado
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    {formData.template ? (
                      <div className="p-3 border rounded bg-light">
                        <strong>Template:</strong>
                        <p className="text-muted mb-2 mt-1">
                          {formData.template}
                        </p>
                        <div className="d-flex align-items-center mb-2">
                          <strong className="me-2">Status:</strong>
                          <span className="badge bg-info text-dark">
                            {getTemplateStatusText(
                              templates.find(t => 
                                t.name.toUpperCase() === formData.template
                              )?.status
                            )}
                          </span>
                        </div>
                        
                        <div className="d-flex align-items-center">
                          <strong className="me-2">Categoria:</strong>
                          <span className="badge bg-secondary">
                            {getTemplateCategoryText(
                              templates.find(t => 
                                t.name.toUpperCase() === formData.template
                              )?.category
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <strong>Template:</strong>
                        <p className="text-muted mb-0 mt-1">
                          Não selecionado
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Agendamento:</strong>
                    <p className="text-muted mb-0">
                      {formData.scheduledDateTime 
                        ? new Date(formData.scheduledDateTime).toLocaleString('pt-BR')
                        : 'Não agendado'
                      }
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <strong>Intervalo:</strong>
                    <p className="text-muted mb-0">
                      Entre {formData.intervalMin}s e {formData.intervalMax}s
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <strong>Contatos:</strong>
                    <p className="text-muted mb-0">
                      {isTestMode ? (
                        testContact.name && testContact.phone ? 
                          `1 contato de teste: ${testContact.name}` : 
                          'Nenhum contato informado'
                      ) : (
                        csvData.length > 0 ? `${csvData.length} contatos` : 'Nenhum arquivo carregado'
                      )}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100"
                    disabled={!isFormValid() || loading}
                  >
                    {loading ? (
                      <>
                        <Clock size={16} className="me-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="me-2" />
                        {isTestMode ? 'Enviar Teste' : 'Agendar Disparo'}
                      </>
                    )}
                  </Button>

                  {!isFormValid() && (
                    <div className="mt-3">
                      <small className="text-muted">
                        {isTestMode ? 
                          'Preencha todos os campos e o contato de teste para continuar.' :
                          'Preencha todos os campos e carregue o arquivo CSV para continuar.'
                        }
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  )
}

export default Dispatch