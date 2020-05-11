import Company from '../models/Company';

class CompanyFileController {
  async update(req, res) {
    const { id_logo, id_company } = req.body;

    const companyExists = await Company.findByPk(id_company);

    if (!companyExists) {
      return res.status(400).json({ error: 'Not company exists.' });
    }
    await companyExists.update({ logo_id: id_logo });

    return res.status(200).json({
      success: 'Logo editado com sucesso!',
    });
  }
}

export default new CompanyFileController();
