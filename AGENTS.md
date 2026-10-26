# Regras do projeto

- Em toda alteração no site, conferir e atualizar `ABRIR-SITE.bat` quando necessário.
- Regenerar `dist/RancingExperience.jar` com `bash package.sh` (ou `package.bat`) quando código Java, páginas, estilos ou assets mudarem. O lançador deve abrir um pacote com as alterações atuais.
- Manter a versão estática em `hospedagem-netlify/` sincronizada com as alterações de visual. As reservas dessa versão permanecem indisponíveis sem backend Java.
- Validar o pacote e preservar a pasta de dados das reservas. Não encerrar processos de usuários automaticamente para atualizar o site.
