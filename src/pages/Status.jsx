import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Button, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { ArrowLeft, Activity, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'

function Status() {
  const [channels, setChannels] = useState([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [error, setError] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  
  // Buscar canais da API
  const fetchChannels = async () => {
    setLoadingChannels(true)
    setError('')
    try {
      const response = await fetch('https://webhook.sistemavieira.com.br/webhook/canais')
      if (response.ok) {
        const data = await response.json()
        setChannels(data)
      } else {
        setError('Erro ao buscar canais: ' + response.statusText)
      }
    } catch (error) {
      setError('Erro ao conectar com a API: ' + error.message)
    } finally {
      setLoadingChannels(false)
    }
  }
  
  // Carregar canais ao montar o componente
  useEffect(() => {
    fetchChannels()
  }, [])
  
  // Função para determinar a classe do badge baseada no status
  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'connected':
        return 'status-connected'
      case 'flagged':
        return 'status-flagged'
      default:
        return 'status-undefined'
    }
  }
  
  // Função para formatar o status com primeira letra maiúscula
  const getStatusText = (status) => {
    if (!status) return 'Indefinido'
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }
  
  // Função para determinar a cor da bolinha quality rating
  const getQualityColor = (rating) => {
    switch(rating?.toLowerCase()) {
      case 'green':
        return '#28a745' // Verde
      case 'yellow':
      case 'orange':
        return '#ffc107' // Amarelo/Laranja para Medium
      case 'red':
        return '#dc3545' // Vermelho
      default:
        return '#ffc107' // Amarelo para Medium (padrão)
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
        return 'Medium'
    }
  }

  // Função para ordenar os dados
  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Ordenar os canais baseado na configuração atual
  const sortedChannels = React.useMemo(() => {
    let sortableChannels = [...channels]
    if (sortConfig.key) {
      sortableChannels.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]
        
        // Tratamento especial para diferentes tipos de dados
        if (sortConfig.key === 'display_phone_number') {
          aValue = aValue || ''
          bValue = bValue || ''
        } else if (sortConfig.key === 'status' || sortConfig.key === 'quality_rating') {
          aValue = (aValue || '').toLowerCase()
          bValue = (bValue || '').toLowerCase()
        } else {
          aValue = aValue || ''
          bValue = bValue || ''
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableChannels
  }, [channels, sortConfig])

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-muted ms-1" style={{opacity: 0.3}}>↕</span>
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} className="ms-1 text-primary" /> : 
      <ChevronDown size={14} className="ms-1 text-primary" />
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
                  <h1 className="h3 fw-bold mb-1">Status WhatsApp</h1>
                  <p className="text-muted mb-0">Monitore o status de todos os canais WhatsApp</p>
                </div>
              </div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="ms-auto"
                onClick={fetchChannels}
                disabled={loadingChannels}
              >
                <RefreshCw size={16} className="me-1" />
                {loadingChannels ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Canais WhatsApp ({channels.length})</h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loadingChannels ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
                <p className="text-muted mb-0">Carregando canais...</p>
              </div>
            ) : (
              <div className="tracking-table-container">
                <Table className="mb-0 tracking-table">
                  <thead>
                    <tr>
                      <th 
                        onClick={() => handleSort('account_name')} 
                        style={{cursor: 'pointer', userSelect: 'none'}}
                        className="sortable-header"
                      >
                        Canal {renderSortIcon('account_name')}
                      </th>
                      <th 
                        onClick={() => handleSort('display_phone_number')} 
                        style={{cursor: 'pointer', userSelect: 'none'}}
                        className="sortable-header"
                      >
                        Telefone {renderSortIcon('display_phone_number')}
                      </th>
                      <th 
                        onClick={() => handleSort('verified_name')} 
                        style={{cursor: 'pointer', userSelect: 'none'}}
                        className="sortable-header"
                      >
                        Nome Verificado {renderSortIcon('verified_name')}
                      </th>
                      <th 
                        onClick={() => handleSort('status')} 
                        style={{cursor: 'pointer', userSelect: 'none'}}
                        className="sortable-header"
                      >
                        Status {renderSortIcon('status')}
                      </th>
                      <th 
                        onClick={() => handleSort('quality_rating')} 
                        style={{cursor: 'pointer', userSelect: 'none'}}
                        className="sortable-header"
                      >
                        Quality Rating {renderSortIcon('quality_rating')}
                      </th>

                    </tr>
                  </thead>
                  <tbody>
                    {sortedChannels.map(channel => (
                      <tr key={channel.record_id}>
                        <td>
                          <div className="fw-medium">{channel.account_name}</div>
                          <small className="text-muted">ID: {channel.phone_id}</small>
                        </td>
                        <td>{channel.display_phone_number}</td>
                        <td>{channel.verified_name || '-'}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(channel.status)}`}>
                            {getStatusText(channel.status)}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div 
                              className="me-2"
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: getQualityColor(channel.quality_rating),
                                border: '1px solid rgba(0,0,0,0.2)'
                              }}
                            />
                            <span>{getQualityText(channel.quality_rating)}</span>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </Table>
                {channels.length === 0 && !loadingChannels && (
                  <div className="text-center p-5">
                    <p className="text-muted mb-0">Nenhum canal encontrado</p>
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}

export default Status