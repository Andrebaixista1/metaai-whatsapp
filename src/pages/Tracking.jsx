import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, XCircle, Activity, Phone, Info, Search, Filter, Download } from 'lucide-react'

function Tracking() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 })
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
    campanha: '',
    status: '',
    dataAgendada: '', // datetime-local format
    dataCriacao: '',  // datetime-local format
    template: '',
    busca: ''
  })

  const toDigits = (v) => String(v ?? '').replace(/\D/g, '')
  const formatWhatsapp = (phone) => {
    const digits = toDigits(phone)
    if (!digits) return ''
    let rest = digits
    if (rest.startsWith('55')) rest = rest.slice(2)
    if (rest.length < 10) return `+55 ${digits}` // fallback
    const ddd = rest.slice(0, 2)
    const num = rest.slice(2)
    if (num.length === 9) return `+55 (${ddd}) ${num.slice(0,5)}-${num.slice(5)}`
    if (num.length === 8) return `+55 (${ddd}) ${num.slice(0,4)}-${num.slice(4)}`
    // Outros comprimentos, tenta 5-4 por padrão
    const split = num.length > 5 ? 5 : Math.ceil(num.length/2)
    return `+55 (${ddd}) ${num.slice(0, split)}-${num.slice(split)}`
  }

  const formatDateTimeSP = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(d)
    const get = (t) => parts.find(p => p.type === t)?.value || ''
    const dd = get('day')
    const mm = get('month')
    const yyyy = get('year')
    const hh = get('hour')
    const min = get('minute')
    // dd/mm/aaaa hh:mm (com separadores na data)
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
  }

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch('https://webhook.sistemavieira.com.br/webhook/tracking')
      if (!resp.ok) {
        const tx = await resp.text()
        throw new Error(`HTTP ${resp.status} - ${tx}`)
      }
      const json = await resp.json()
      const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.body) ? json.body : []
      setItems(arr)
    } catch (e) {
      setError('Falha ao carregar acompanhamento. Tente novamente mais tarde.')
      console.error('Erro ao buscar tracking:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statusBadge = (status) => {
    const s = Number(status)
    switch (s) {
      case 1:
        return (
          <span className="status-badge status-success">
            <CheckCircle2 size={12} className="me-1"/> 
            Enviado
          </span>
        )
      case 2:
        return (
          <span className="status-badge status-error">
            <XCircle size={12} className="me-1"/> 
            Erro
          </span>
        )
      case 0:
        return (
          <span className="status-badge status-pending">
            <Clock size={12} className="me-1"/> 
            Pendente
          </span>
        )
      default:
        return (
          <span className="status-badge status-undefined">
            Indefinido
          </span>
        )
    }
  }

  const renderMotivo = (typeError, sendStatus) => {
    // Se não há erro e foi enviado com sucesso
    if (!typeError && Number(sendStatus) === 1) {
      const handleMouseEnter = (e) => {
        const rect = e.target.getBoundingClientRect()
        setTooltip({
          visible: true,
          content: 'Enviado com Sucesso',
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
      }
      
      const handleMouseLeave = () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 })
      }
      
      return (
        <Info 
          size={16} 
          className="text-success cursor-pointer motivo-icon-simple" 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )
    }
    
    // Se há erro, mostra o erro
    if (typeError) {
      const handleMouseEnter = (e) => {
        const rect = e.target.getBoundingClientRect()
        setTooltip({
          visible: true,
          content: typeError,
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
      }
      
      const handleMouseLeave = () => {
        setTooltip({ visible: false, content: '', x: 0, y: 0 })
      }
      
      return (
        <Info 
          size={16} 
          className="text-danger cursor-pointer motivo-icon-simple" 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )
    }
    
    // Casos onde não há informação
    return '-'
  }

  // Função para obter opções únicas dos filtros (apenas para campos que ainda usam select)
  const getUniqueOptions = (field) => {
    const values = items.map(item => {
      switch(field) {
        case 'campanha': return item.nameBatch
        case 'status': return item.sendStatus
        case 'template': return item.template
        default: return ''
      }
    })
    return [...new Set(values.filter(Boolean))].sort()
  }

  // Função para converter datetime-local para Date
  const parseLocalDateTime = (datetimeLocal) => {
    if (!datetimeLocal) return null
    return new Date(datetimeLocal)
  }

  // Função para obter Date do timestamp da API
  const getDateFromTimestamp = (timestamp) => {
    if (!timestamp) return null
    return new Date(timestamp)
  }

  // Função para filtrar os itens
  const applyFilters = () => {
    let filtered = [...items]
    
    // Filtro por campanha
    if (filters.campanha) {
      filtered = filtered.filter(item => item.nameBatch === filters.campanha)
    }
    
    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(item => item.sendStatus?.toString() === filters.status)
    }
    
    // Filtro por data agendada (>= data digitada)
    if (filters.dataAgendada) {
      const filterDate = parseLocalDateTime(filters.dataAgendada)
      if (filterDate) {
        filtered = filtered.filter(item => {
          const itemDate = getDateFromTimestamp(item.scheduledDateTime)
          return itemDate && itemDate >= filterDate
        })
      }
    }
    
    // Filtro por data criação (>= data digitada)
    if (filters.dataCriacao) {
      const filterDate = parseLocalDateTime(filters.dataCriacao)
      if (filterDate) {
        filtered = filtered.filter(item => {
          const itemDate = getDateFromTimestamp(item.criado_em)
          return itemDate && itemDate >= filterDate
        })
      }
    }
    
    // Filtro por template
    if (filters.template) {
      filtered = filtered.filter(item => item.template === filters.template)
    }
    
    // Filtro por busca (cliente, whatsapp, telefone disparado)
    if (filters.busca) {
      const searchTerm = filters.busca.toLowerCase()
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchTerm) ||
        formatWhatsapp(item.phone)?.toLowerCase().includes(searchTerm) ||
        formatWhatsapp(item.display_phone_number)?.toLowerCase().includes(searchTerm)
      )
    }
    
    setFilteredItems(filtered)
  }

  // Aplicar filtros sempre que items ou filters mudarem
  useEffect(() => {
    applyFilters()
  }, [items, filters])

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      campanha: '',
      status: '',
      dataAgendada: '',
      dataCriacao: '',
      template: '',
      busca: ''
    })
  }

  // Função para atualizar filtros
  const updateFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  // Função para obter texto do status
  const getStatusText = (status) => {
    const s = Number(status)
    switch (s) {
      case 1: return 'Enviado'
      case 2: return 'Erro'
      case 0: return 'Pendente'
      default: return 'Indefinido'
    }
  }

  // Função para gerar e baixar CSV
  const downloadCSV = () => {
    // Cabeçalhos da tabela
    const headers = [
      'ID',
      'Cliente',
      'WhatsApp',
      'Campanha Enviada',
      'Telefone Disparado',
      'Data e Hora Agendado',
      'Criação',
      'Status',
      'Motivo',
      'Template Enviado'
    ]

    // Converter dados filtrados para CSV
    const csvData = filteredItems.map(item => {
      const motivo = item.typeError || (Number(item.sendStatus) === 1 ? 'Enviado com Sucesso' : '')
      
      return [
        item.id || '',
        item.name || '',
        formatWhatsapp(item.phone) || '',
        item.nameBatch || '',
        formatWhatsapp(item.display_phone_number) || '',
        formatDateTimeSP(item.scheduledDateTime) || '',
        formatDateTimeSP(item.criado_em) || '',
        getStatusText(item.sendStatus),
        motivo,
        item.template || ''
      ]
    })

    // Combinar cabeçalhos e dados
    const allData = [headers, ...csvData]

    // Converter para string CSV com separador ;
    const csvContent = allData.map(row => 
      row.map(field => {
        // Escapar aspas duplas e envolver campos que contêm ; ou quebras de linha
        const fieldStr = String(field).replace(/"/g, '""')
        return fieldStr.includes(';') || fieldStr.includes('\n') || fieldStr.includes('"') 
          ? `"${fieldStr}"` 
          : fieldStr
      }).join(';')
    ).join('\n')

    // Adicionar BOM para UTF-8
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent

    // Criar e baixar arquivo
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      // Nome do arquivo com data/hora atual
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-')
      link.setAttribute('download', `tracking-disparos-${timestamp}.csv`)
      
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Liberar URL object
      URL.revokeObjectURL(url)
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
              <div className="d-flex align-items-center">
                <Activity size={24} className="text-primary me-2" />
                <div>
                  <h1 className="h3 fw-bold mb-1">Acompanhamento de Disparos</h1>
                  <p className="text-muted mb-0">Consulte o progresso e resultados das campanhas</p>
                </div>
              </div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="ms-auto"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw size={16} className="me-1" />
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Seção de Filtros */}
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <div className="d-flex align-items-center">
              <Filter size={20} className="text-primary me-2" />
              <h6 className="mb-0">Filtros</h6>
              <div className="ms-auto d-flex gap-2">
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={downloadCSV}
                  disabled={filteredItems.length === 0}
                >
                  <Download size={16} className="me-1" />
                  Baixar CSV
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {/* Busca Geral */}
              <Col md={6} lg={4}>
                <Form.Label>Buscar Cliente/WhatsApp/Telefone</Form.Label>
                <InputGroup>
                  <InputGroup.Text><Search size={16} /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Digite para buscar..."
                    value={filters.busca}
                    onChange={(e) => updateFilter('busca', e.target.value)}
                  />
                </InputGroup>
              </Col>
              
              {/* Filtro por Campanha */}
              <Col md={6} lg={4}>
                <Form.Label>Campanha Enviada</Form.Label>
                <Form.Select 
                  value={filters.campanha}
                  onChange={(e) => updateFilter('campanha', e.target.value)}
                >
                  <option value="">Todas as campanhas</option>
                  {getUniqueOptions('campanha').map(campanha => (
                    <option key={campanha} value={campanha}>{campanha}</option>
                  ))}
                </Form.Select>
              </Col>
              
              {/* Filtro por Status */}
              <Col md={6} lg={4}>
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                >
                  <option value="">Todos os status</option>
                  {getUniqueOptions('status').map(status => (
                    <option key={status} value={status}>{getStatusText(status)}</option>
                  ))}
                </Form.Select>
              </Col>
              
              {/* Filtro por Data Agendada */}
              <Col md={6} lg={4}>
                <Form.Label>Data e Hora Agendada (&gt;=)</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={filters.dataAgendada}
                  onChange={(e) => updateFilter('dataAgendada', e.target.value)}
                  placeholder="Selecione data e hora..."
                />
                <small className="text-muted">Mostra registros agendados a partir desta data/hora</small>
              </Col>
              
              {/* Filtro por Data Criação */}
              <Col md={6} lg={4}>
                <Form.Label>Data e Hora de Criação (&gt;=)</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={filters.dataCriacao}
                  onChange={(e) => updateFilter('dataCriacao', e.target.value)}
                  placeholder="Selecione data e hora..."
                />
                <small className="text-muted">Mostra registros criados a partir desta data/hora</small>
              </Col>
              
              {/* Filtro por Template */}
              <Col md={6} lg={4}>
                <Form.Label>Template</Form.Label>
                <Form.Select 
                  value={filters.template}
                  onChange={(e) => updateFilter('template', e.target.value)}
                >
                  <option value="">Todos os templates</option>
                  {getUniqueOptions('template').map(template => (
                    <option key={template} value={template}>{template}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            
            {/* Contador de resultados */}
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                Exibindo {filteredItems.length} de {items.length} registros
                {filteredItems.length !== items.length && ' (filtrados)'}
              </small>
            </div>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Registros ({filteredItems.length})</h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
                <p className="text-muted mb-0">Carregando acompanhamento...</p>
              </div>
            ) : (
              <div className="tracking-table-container">
                <Table className="mb-0 tracking-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Whatsapp</th>
                      <th>Campanha Enviada</th>
                      <th>Telefone Disparado</th>
                      <th>Data e Hora | Agendado</th>
                      <th>Criação</th>
                      <th>Status</th>
                      <th>Motivo</th>
                      <th>Template enviado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((it, idx) => (
                      <tr key={`${it.id}-${idx}`}>
                        <td className="text-muted">{it.id}</td>
                        <td>{it.name}</td>
                        <td><Phone size={14} className="me-1 text-muted"/>{formatWhatsapp(it.phone)}</td>
                        <td>{it.nameBatch}</td>
                        <td>{formatWhatsapp(it.display_phone_number)}</td>
                        <td>{formatDateTimeSP(it.scheduledDateTime)}</td>
                        <td>{formatDateTimeSP(it.criado_em)}</td>
                        <td>{statusBadge(it.sendStatus)}</td>
                        <td className="text-center">{renderMotivo(it.typeError, it.sendStatus)}</td>
                        <td className="text-muted">{it.template}</td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center text-muted py-4">
                          {items.length === 0 ? 'Nenhum disparo encontrado.' : 'Nenhum registro corresponde aos filtros aplicados.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
      
      {/* Tooltip Global */}
      {tooltip.visible && (
        <div 
          className="global-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 99999,
            background: '#333',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            maxWidth: '300px',
            minWidth: '150px',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            lineHeight: '1.4',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        >
          {tooltip.content}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #333'
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Tracking
