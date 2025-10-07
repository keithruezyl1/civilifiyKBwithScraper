-- Migration 018: Populate Entry Subtypes
-- Purpose: Define schemas for all legal document types from the automation plan

-- Constitution Provisions
INSERT INTO entry_subtypes (type, subtype, field_schema) VALUES
('constitution_provision', 'constitution_1987', '{
  "required": ["article_number", "section_number", "title", "body", "topics"],
  "properties": {
    "article_number": {"type": "integer", "minimum": 0},
    "section_number": {"type": "integer", "minimum": 0},
    "chapter_number": {"type": ["integer", "null"]},
    "preamble": {"type": "boolean", "default": false},
    "body": {"type": "string"},
    "topics": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "jurisprudence": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('constitution_provision', 'constitution_1986', '{
  "required": ["article_number", "section_number", "title", "body", "topics"],
  "properties": {
    "article_number": {"type": "integer", "minimum": 0},
    "section_number": {"type": "integer", "minimum": 0},
    "chapter_number": {"type": ["integer", "null"]},
    "preamble": {"type": "boolean", "default": false},
    "body": {"type": "string"},
    "topics": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "jurisprudence": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('constitution_provision', 'constitution_1973', '{
  "required": ["article_number", "section_number", "title", "body", "topics"],
  "properties": {
    "article_number": {"type": "integer", "minimum": 0},
    "section_number": {"type": "integer", "minimum": 0},
    "chapter_number": {"type": ["integer", "null"]},
    "preamble": {"type": "boolean", "default": false},
    "body": {"type": "string"},
    "topics": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "jurisprudence": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('constitution_provision', 'constitution_1935', '{
  "required": ["article_number", "section_number", "title", "body", "topics"],
  "properties": {
    "article_number": {"type": "integer", "minimum": 0},
    "section_number": {"type": "integer", "minimum": 0},
    "chapter_number": {"type": ["integer", "null"]},
    "preamble": {"type": "boolean", "default": false},
    "body": {"type": "string"},
    "topics": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "jurisprudence": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('constitution_provision', 'constitution_malolos', '{
  "required": ["article_number", "section_number", "title", "body", "topics"],
  "properties": {
    "article_number": {"type": "integer", "minimum": 0},
    "section_number": {"type": "integer", "minimum": 0},
    "chapter_number": {"type": ["integer", "null"]},
    "preamble": {"type": "boolean", "default": false},
    "body": {"type": "string"},
    "topics": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "jurisprudence": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}');

-- Statute Sections
INSERT INTO entry_subtypes (type, subtype, field_schema) VALUES
('statute_section', 'republic_act', '{
  "required": ["ra_number", "section_number", "title", "body"],
  "properties": {
    "ra_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "title": {"type": "string"},
    "body": {"type": "string"},
    "elements": {"type": "array", "items": {"type": "string"}},
    "penalties": {"type": "array", "items": {"type": "string"}},
    "defenses": {"type": "array", "items": {"type": "string"}},
    "prescriptive_period": {
      "type": "object",
      "properties": {
        "value": {"type": ["number", "string"], "pattern": "^(NA|\\d+(\\.\\d+)?)$"},
        "unit": {"type": ["string", "null"], "enum": ["days", "months", "years", "NA", null]}
      }
    },
    "standard_of_proof": {"type": "string"},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('statute_section', 'commonwealth_act', '{
  "required": ["commonwealth_act_number", "section_number", "title", "body"],
  "properties": {
    "commonwealth_act_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "title": {"type": "string"},
    "body": {"type": "string"},
    "elements": {"type": "array", "items": {"type": "string"}},
    "penalties": {"type": "array", "items": {"type": "string"}},
    "defenses": {"type": "array", "items": {"type": "string"}},
    "prescriptive_period": {
      "type": "object",
      "properties": {
        "value": {"type": ["number", "string"], "pattern": "^(NA|\\d+(\\.\\d+)?)$"},
        "unit": {"type": ["string", "null"], "enum": ["days", "months", "years", "NA", null]}
      }
    },
    "standard_of_proof": {"type": "string"},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('statute_section', 'mga_batas_pambansa', '{
  "required": ["mbp_number", "section_number", "title", "body"],
  "properties": {
    "mbp_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "title": {"type": "string"},
    "body": {"type": "string"},
    "elements": {"type": "array", "items": {"type": "string"}},
    "penalties": {"type": "array", "items": {"type": "string"}},
    "defenses": {"type": "array", "items": {"type": "string"}},
    "prescriptive_period": {
      "type": "object",
      "properties": {
        "value": {"type": ["number", "string"], "pattern": "^(NA|\\d+(\\.\\d+)?)$"},
        "unit": {"type": ["string", "null"], "enum": ["days", "months", "years", "NA", null]}
      }
    },
    "standard_of_proof": {"type": "string"},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('statute_section', 'act', '{
  "required": ["act_number", "section_number", "title", "body"],
  "properties": {
    "act_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "title": {"type": "string"},
    "body": {"type": "string"},
    "elements": {"type": "array", "items": {"type": "string"}},
    "penalties": {"type": "array", "items": {"type": "string"}},
    "defenses": {"type": "array", "items": {"type": "string"}},
    "prescriptive_period": {
      "type": "object",
      "properties": {
        "value": {"type": ["number", "string"], "pattern": "^(NA|\\d+(\\.\\d+)?)$"},
        "unit": {"type": ["string", "null"], "enum": ["days", "months", "years", "NA", null]}
      }
    },
    "standard_of_proof": {"type": "string"},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}');

-- Rules of Court
INSERT INTO entry_subtypes (type, subtype, field_schema) VALUES
('rule_of_court_provision', 'roc_criminal_proc_1985', '{
  "required": ["rule_number", "section_number", "title", "body"],
  "properties": {
    "part_number": {"type": ["integer", "null"]},
    "rule_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "body": {"type": "string"},
    "triggers": {"type": "array", "items": {"type": "string"}},
    "time_limits": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('rule_of_court_provision', 'roc_civil_proc', '{
  "required": ["rule_number", "section_number", "title", "body"],
  "properties": {
    "part_number": {"type": ["integer", "null"]},
    "rule_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "body": {"type": "string"},
    "triggers": {"type": "array", "items": {"type": "string"}},
    "time_limits": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('rule_of_court_provision', 'roc_evidence_2019', '{
  "required": ["rule_number", "section_number", "title", "body"],
  "properties": {
    "part_number": {"type": ["integer", "null"]},
    "rule_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "body": {"type": "string"},
    "triggers": {"type": "array", "items": {"type": "string"}},
    "time_limits": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('rule_of_court_provision', 'roc_special_proceedings', '{
  "required": ["rule_number", "section_number", "title", "body"],
  "properties": {
    "part_number": {"type": ["integer", "null"]},
    "rule_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "body": {"type": "string"},
    "triggers": {"type": "array", "items": {"type": "string"}},
    "time_limits": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}'),

('rule_of_court_provision', 'roc_other', '{
  "required": ["rule_number", "section_number", "title", "body"],
  "properties": {
    "part_number": {"type": ["integer", "null"]},
    "rule_number": {"type": "integer", "minimum": 1},
    "section_number": {"type": "string", "minLength": 1},
    "body": {"type": "string"},
    "triggers": {"type": "array", "items": {"type": "string"}},
    "time_limits": {"type": "array", "items": {"type": "string"}},
    "legal_bases": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}},
    "related_sections": {"type": "array", "items": {"$ref": "#/$defs/entryRef"}}
  }
}');
