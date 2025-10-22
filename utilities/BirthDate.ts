export default function isValidBirthDate(birthDate: Date | string): boolean {
    const hoje = new Date();
    const nascimento = birthDate instanceof Date ? birthDate : new Date(birthDate);

    if (isNaN(nascimento.getTime())) {
        return false;
    }

    // Verifica se a data não é futura
    if (nascimento > hoje) {
        return false;
    }

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    if (idade < 16) return false;
    if (idade > 80) return false;
    return true;
}