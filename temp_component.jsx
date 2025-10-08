import React, { useState } from 'react'
import { Alert, Collapse, Button } from 'react-bootstrap'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

function CsvFormatInfo() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Alert variant="info" className="mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Info size={16} className="me-2" />
          <strong>Formato do arquivo CSV</strong>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="p-0 text-decoration-none"
        >
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      
      <Collapse in={showDetails}>
        <div className="mt-3">
          <h6>ðŸ“‹ Estrutura obrigatÃ³ria:</h6>
          <ul className="mb-3">
            <li><strong>Separador:</strong> Ponto e vÃ­rgula (;)</li>
            <li><strong>CodificaÃ§Ã£o:</strong> UTF-8</li>
            <li><strong>Primeira linha:</strong> CabeÃ§alho com nomes das colunas</li>
          </ul>
          
          <h6>ðŸ“Š Colunas:</h6>
          <ul className="mb-3">
            <li><strong>name:</strong> Nome completo do contato <span className="text-danger">(obrigatÃ³rio)</span></li>
            <li><strong>phone:</strong> NÃºmero do telefone <span className="text-danger">(obrigatÃ³rio)</span></li>
            <li><strong>email:</strong> Email do contato <span className="text-success">(opcional)</span></li>
          </ul>
          
          <h6>ðŸ“± Formatos de telefone aceitos:</h6>
          <ul className="mb-3">
            <li>11999999999</li>
            <li>+5511999999999</li>
            <li>(11) 99999-9999</li>
            <li>11 99999-9999</li>
          </ul>
          
          <h6>ðŸ’¡ Exemplo de arquivo CSV:</h6>
          <div className="bg-dark p-2 rounded">
            <code className="text-light">
              name;phone;email<br />
              JoÃ£o Silva;11999999999;joao@email.com<br />
              Maria Santos;+5511888888888;maria@email.com<br />
              Pedro Oliveira;(11) 77777-7777;<br />
              <small className="text-success">* Pedro nÃ£o tem email (opcional)</small>
            </code>
          </div>
        </div>
      </Collapse>
    </Alert>
  )
}

export default CsvFormatInfo
