import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { Plus, Activity } from 'lucide-react'

function Dashboard() {
  console.log('Dashboard renderizando...') // Debug
  
  return (
    <div className="dashboard-page">
      <Container fluid className="py-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <div className="text-center mb-5">
              <h1 className="mb-3">Dashboard</h1>
              <p className="text-muted">Gerencie seus disparos em massa de WhatsApp</p>
            </div>
            
            <Row>
              {/* Card Novo Disparo */}
              <Col md={6} className="mb-4">
                <Card className="text-center shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                        <Plus size={24} className="text-primary" />
                      </div>
                    </div>
                    <h5 className="mb-3">Criar Novo Disparo</h5>
                    <p className="text-muted mb-4">
                      Configure e agende um novo disparo em massa
                    </p>
                    <Button 
                      as={Link} 
                      to="/dispatch" 
                      variant="primary" 
                      className="px-4"
                    >
                      <Plus size={18} className="me-2" />
                      Novo Disparo
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              
              {/* Card Status WhatsApp */}
              <Col md={6} className="mb-4">
                <Card className="text-center shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="mb-3">
                      <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                        <Activity size={24} className="text-success" />
                      </div>
                    </div>
                    <h5 className="mb-3">Status WhatsApp</h5>
                    <p className="text-muted mb-4">
                      Monitore o status de todos os canais
                    </p>
                    <Button 
                      as={Link} 
                      to="/status" 
                      variant="success" 
                      className="px-4"
                    >
                      <Activity size={18} className="me-2" />
                      Ver Status
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  )
}



export default Dashboard