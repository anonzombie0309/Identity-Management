const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
const Contact = require('./models/contact');
const sequelize = require('./config/db');
const app = express();
app.use(cors());
app.use(express.json());

// Identify endpoint
 app.post('/identify', async (req, res) => {
  try {
    let { email, phoneNumber } = req.body;
    if(email == null && phoneNumber == null){
      return res.status(404).json({ error: 'Email and phoneNumber both cannot be null' });
    }

    // Found all contacts that will match either email or phoneNumber
    const matchedContacts = await Contact.findAll({
      where: {
        [Op.or]: [
          ...(email ? [{ email }] : []),
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    // If no contacts found, create a new primary entry
    if (matchedContacts.length === 0) {
      const newContact = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary'
      });
      return res.json({
        contact: {
          primaryContatctId: newContact.id,
          emails: [newContact.email].filter(Boolean),
          phoneNumbers: [newContact.phoneNumber].filter(Boolean),
          secondaryContactIds: []
        }
      });
    }

    // Gathered all related contact IDs (primaries and secondaries)
    // Collect all unique primary IDs (either self or linkedId=null)
    let allContactIds = new Set();
    let primaryIds = new Set();
    matchedContacts.forEach(c => {
      if (c.linkPrecedence === 'primary') {
        primaryIds.add(c.id);
      } else if (c.linkedId) {
        primaryIds.add(c.linkedId);
      }
      allContactIds.add(c.id);
    });

    // Found all contacts linked to any of the primaries (including secondaries)
    let relatedContacts = [];
    if (primaryIds.size > 1) {
      // Merged primaries entries : find all contacts linked to any primary entry
      relatedContacts = await Contact.findAll({
        where: {
          [Op.or]: [
            { id: { [Op.in]: Array.from(primaryIds) } },
            { linkedId: { [Op.in]: Array.from(primaryIds) } }
          ]
        },
        order: [['createdAt', 'ASC']]
      });

      // Found the oldest primary entry in the database
      const primaries = relatedContacts.filter(c => c.linkPrecedence === 'primary');
      primaries.sort((a, b) => a.createdAt - b.createdAt);
      const oldestPrimary = primaries[0];

      // Updated all other primaries entries to secondary
      await Promise.all(
        primaries.slice(1).map(p =>
          p.update({ linkPrecedence: 'secondary', linkedId: oldestPrimary.id })
        )
      );

      // Updated any secondary entry that were linked to the demoted primary entries
      await Contact.update(
        { linkedId: oldestPrimary.id },
        {
          where: {
            linkedId: { [Op.in]: primaries.slice(1).map(p => p.id) }
          }
        }
      );

      // After updates, refetch all related contacts for the final group
      relatedContacts = await Contact.findAll({
        where: {
          [Op.or]: [
            { id: oldestPrimary.id },
            { linkedId: oldestPrimary.id }
          ]
        },
        order: [['createdAt', 'ASC']]
      });
    } else {
      // Only one primary entry in the group
      const primaryId = Array.from(primaryIds)[0];
      relatedContacts = await Contact.findAll({
        where: {
          [Op.or]: [
            { id: primaryId },
            { linkedId: primaryId }
          ]
        },
        order: [['createdAt', 'ASC']]
      });
    }

    // If new infomation found, create secondary contact
    const hasEmail = relatedContacts.some(c => c.email === email);
    const hasPhone = relatedContacts.some(c => c.phoneNumber === phoneNumber);
    let newSecondary = null;
    if ((email && !hasEmail) || (phoneNumber && !hasPhone)) {
      const oldestPrimary = relatedContacts.find(c => c.linkPrecedence === 'primary');
      newSecondary = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: 'secondary',
        linkedId: oldestPrimary.id
      });
      relatedContacts.push(newSecondary);
    }

    // Builded response
    const oldestPrimary = relatedContacts.find(c => c.linkPrecedence === 'primary');
    const emails = [...new Set(relatedContacts.map(c => c.email).filter(e => e && e !== "null"))];
    const phoneNumbers = [...new Set(relatedContacts.map(c => c.phoneNumber).filter(p => p && p !== "null"))];
    const secondaryContactIds = relatedContacts
      .filter(c => c.linkPrecedence === 'secondary')
      .map(c => c.id);

    return res.json({
      contact: {
        primaryContatctId: oldestPrimary.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


function formatResponse(primaryContact) {
  return {
    contact: {
      primaryContatctId: primaryContact.id,
      emails: [primaryContact.email].filter(Boolean),
      phoneNumbers: [primaryContact.phoneNumber].filter(Boolean),
      secondaryContactIds: []
    }
  };
}

sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
});