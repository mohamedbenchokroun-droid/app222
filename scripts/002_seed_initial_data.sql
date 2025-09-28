-- Insert default commercials
INSERT INTO public.commercials (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Commercial Principal')
ON CONFLICT (id) DO NOTHING;

-- Insert default tags with their associated statuses
INSERT INTO public.tags (name, status) VALUES 
  ('Appelé, en cours', 'contact'),
  ('Ne répond pas', 'contact'),
  ('Demande échantillon / BAT', 'validation'),
  ('Rappel programmé', 'contact'),
  ('Remise accordée', 'negotiation'),
  ('Devis envoyé', 'proposal'),
  ('En attente de validation', 'validation'),
  ('Négociation prix', 'negotiation'),
  ('Prêt à signer', 'validation')
ON CONFLICT DO NOTHING;
