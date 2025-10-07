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

  // Buscar templates da API
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

  // Carregar canais e templates ao montar o componente
  useEffect(() => {
    fetchChannels()
    fetchTemplates()
    
    // Definir data e hora atual como padrão (horário local)
    const now = new Date()
    // Ajustar para o timezone local (remove o offset UTC)
    const offset = now.getTimezoneOffset() * 60000 // offset em millisegundos
    const localTime = new Date(now.getTime() - offset)
    const currentDateTime = localTime.toISOString().slice(0, 16) // Formato YYYY-MM-DDTHH:mm
    setFormData(prev => ({
      ...prev,
      scheduledDateTime: currentDateTime
    }))
  }, [])

  // Dados mockados
  const mockChannels = [
    { id: 1, name: 'Canal Principal', phone: '+55 11 99999-9999' },
    { id: 2, name: 'Canal Marketing', phone: '+55 11 88888-8888' },
    { id: 3, name: 'Canal Cobrança', phone: '+55 11 77777-7777' }
  ]

  const mockTemplates = [
    { id: 1, name: 'Promoção Black Friday', category: 'Marketing' },
    { id: 2, name: 'Lembrete Vencimento', category: 'Cobrança' },
    { id: 3, name: 'Newsletter Template', category: 'Informativo' },
    { id: 4, name: 'Boas Vindas', category: 'Onboarding' }
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simular envio
    setTimeout(() => {
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
        setUploadProgress(0)
      }, 3000)
    }, 2000)
  }

  const isFormValid = () => {
    return formData.name && 
           formData.channel && 
           formData.template && 
           formData.scheduledDateTime && 
           csvData.length > 0
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
                          disabled={loadingTemplates}
                        >
                          <option value="">
                            {loadingTemplates ? 'Carregando templates...' : 'Selecione um template'}
                          </option>
                          {templates.map(template => (
                            <option key={template.record_id} value={template.name.toUpperCase()}>
                              {template.name.toUpperCase()}
                            </option>
                          ))}
                        </Form.Select>
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
                          min={new Date().toISOString().slice(0, 16)}
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

              {/* Upload CSV */}
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">
                      <Upload size={20} className="me-2" />
                      Upload de Contatos (CSV)
                    </h5>
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      onClick={generateSampleCsv}
                      className="d-flex align-items-center"
                    >
                      <Download size={16} className="me-1" />
                      Baixar Exemplo
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
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
                    <strong>Canal:</strong>
                    <p className="text-muted mb-0">
                      {formData.channel || 'Não selecionado'}
                    </p>
                    {formData.channel && (
                      <div className="mt-2">
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
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Template:</strong>
                    <p className="text-muted mb-0">
                      {formData.template || 'Não selecionado'}
                    </p>
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
                      {csvData.length > 0 ? `${csvData.length} contatos` : 'Nenhum arquivo carregado'}
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
                        Agendar Disparo
                      </>
                    )}
                  </Button>

                  {!isFormValid() && (
                    <div className="mt-3">
                      <small className="text-muted">
                        Preencha todos os campos e carregue o arquivo CSV para continuar.
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