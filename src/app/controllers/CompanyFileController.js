import Company from '../models/Company';

import CreateFileService from '../services/CreateFileService';
import UpdateFileService from '../services/UpdateFileService';

import removerNameDiretorio from '../util/removerNameDiretorio';

class CompanyFileController {
  async update(req, res) {

    const { idCompany } = req.params;

    const companyExists = await Company.findByPk(idCompany);

    if (!companyExists) {
      return res.status(400).json({ error: 'Not company exists.' });
    }

    const { logo_id } = companyExists;
    const { originalname: name } = req.file;
    const {
      filename: path,
      key,
      destination,
      Location: location,
      path: filePath,
    } = req.file.original;

    const newPath = removerNameDiretorio(key);

    if (logo_id === null) {
  
      const file = await CreateFileService.run({
        name,
        path,
        key: newPath,
        destination,
        location,
        filePath,
      });

      await companyExists.update({ logo_id: file._id });
      return res.status(200).json(file);
    }

    const newfile = await UpdateFileService.run({
      id_file: logo_id,
      name,
      path,
      key: newPath,
      destination,
      location,
      filePath,
      file: req.file,
    });

    return res.status(200).json(newfile);
  }
}

export default new CompanyFileController();
