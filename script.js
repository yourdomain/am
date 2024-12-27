$(document).ready(function () {
    const associationKey = 'associations';
    const memberPrefix = 'members-';
    const placeholderImage = './assets/placeholder.png';

    // Initialize associations data
    function initializeData() {
        if (!localStorage.getItem(associationKey)) {
            localStorage.setItem(associationKey, JSON.stringify([]));
        }
        loadAssociations();
        updateBreadcrumb('');
    }

    // Update the breadcrumb navigation text
    function updateBreadcrumb(path) {
        $('#breadcrumb').text(path || '').css({
            'font-size': '1.2rem',
            'color': '#555',
            'text-align': 'right',
            'padding': '5px',
        });
    }

    // Hide all sections
    function hideAllSections() {
        $('#associations-section').addClass('hidden');
        $('#association-form-section').addClass('hidden');
        $('#members-section').addClass('hidden');
        $('#member-form-section').addClass('hidden');
    }

    // Clear the association form
    function clearAssociationForm() {
        $('#association-id').val('');
        $('#association-name').val('');
        $('#association-reg').val('');
        $('#association-address').val('');
        $('#association-photo').val('');
    }

    // Validate the association form
    function validateAssociationForm() {
        const name = $('#association-name').val().trim();
        const reg = $('#association-reg').val().trim();
        if (!name || !reg) {
            alert('Name and Registration Number are mandatory.');
            return false;
        }

        const associations = JSON.parse(localStorage.getItem(associationKey));
        const duplicate = associations.some(
            (a) => a.reg === reg && a.id !== $('#association-id').val()
        );

        if (duplicate) {
            alert('Registration Number must be unique.');
            return false;
        }
        return true;
    }

    // Load associations and render them in the list
    function loadAssociations() {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        $('#associations-list').empty();

        associations.forEach((association) => {
            const photo = association.photo || placeholderImage;
            $('#associations-list').append(`
                <div class="association-card">
                    <div class="association-details">
                        <img src="${photo}" alt="${association.name}" class="association-thumbnail">
                        <div class="association-info">
                            <h3>${association.name}</h3>
                            <p><strong>Regd. No:</strong> ${association.reg}</p>
                            <p><strong>Address:</strong> ${association.address}</p>
                        </div>
                    </div>
                    <div class="association-actions">
                        <button onclick="navigateToMembers('${association.id}')">Members</button>
                        <button onclick="editAssociation('${association.id}')">Edit</button>
                        <button onclick="deleteAssociation('${association.id}')">Delete</button>
                        <button onclick="exportAssociation('${association.id}')">Export</button>
                        <button onclick="generatePDF('${association.id}')">Print</button>
                    </div>
                </div>
            `);
        });
    }



    // Edit an association
    function editAssociation(id) {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        const association = associations.find((a) => a.id === id);

        if (!association) {
            alert('Association not found.');
            return;
        }

        $('#association-id').val(association.id);
        $('#association-name').val(association.name);
        $('#association-reg').val(association.reg);
        $('#association-address').val(association.address);
        $('#association-photo').val('');

        hideAllSections();
        updateBreadcrumb('Edit Association');
        $('#association-form-section').removeClass('hidden');
    }

    // Save an association
    function saveAssociation() {
        if (!validateAssociationForm()) return;

        const id = $('#association-id').val();
        const name = $('#association-name').val().trim();
        const reg = $('#association-reg').val().trim();
        const address = $('#association-address').val().trim();
        const photoFile = $('#association-photo')[0].files[0];

        const associations = JSON.parse(localStorage.getItem(associationKey));

        const reader = new FileReader();
        reader.onload = function (e) {
            const photo = e.target.result;

            if (id) {
                const index = associations.findIndex((a) => a.id === id);
                if (index !== -1) {
                    associations[index] = { id, name, reg, address, photo };
                } else {
                    alert('Association not found. Please refresh the list.');
                    return;
                }
            } else {
                associations.push({
                    id: new Date().getTime().toString(),
                    name,
                    reg,
                    address,
                    photo,
                });
            }

            localStorage.setItem(associationKey, JSON.stringify(associations));
            loadAssociations();
            hideAllSections();
            $('#associations-section').removeClass('hidden');
            updateBreadcrumb('');
        };

        if (photoFile) {
            reader.readAsDataURL(photoFile);
        } else {
            saveWithoutPhoto();
        }

        function saveWithoutPhoto() {
            if (id) {
                const index = associations.findIndex((a) => a.id === id);
                if (index !== -1) {
                    associations[index] = { id, name, reg, address };
                } else {
                    alert('Association not found. Please refresh the list.');
                    return;
                }
            } else {
                associations.push({
                    id: new Date().getTime().toString(),
                    name,
                    reg,
                    address,
                });
            }

            localStorage.setItem(associationKey, JSON.stringify(associations));
            loadAssociations();
            hideAllSections();
            $('#associations-section').removeClass('hidden');
            updateBreadcrumb('');
        }
    }

    // Delete an association
    function deleteAssociation(id) {
        let associations = JSON.parse(localStorage.getItem(associationKey));
        associations = associations.filter((a) => a.id !== id);
        localStorage.setItem(associationKey, JSON.stringify(associations));
        localStorage.removeItem(`${memberPrefix}${id}`);
        loadAssociations();
    }

    // Export all associations
    function exportAllAssociations() {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        const zip = new JSZip();

        associations.forEach((association) => {
            const members = JSON.parse(localStorage.getItem(`${memberPrefix}${association.id}`)) || [];
            zip.file(`${association.name}.json`, JSON.stringify({ association, members }));
        });

        zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, 'associations.zip');
        });
    }

    // Import all associations
    function importAllAssociations(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            JSZip.loadAsync(e.target.result).then((zip) => {
                zip.forEach((relativePath, file) => {
                    file.async('string').then((data) => {
                        const { association, members } = JSON.parse(data);
                        saveImportedAssociation(association, members);
                    });
                });
            });
        };
        reader.readAsArrayBuffer(file);

        function saveImportedAssociation(association, members) {
            const associations = JSON.parse(localStorage.getItem(associationKey));
            if (!associations.some((a) => a.id === association.id)) {
                associations.push(association);
                localStorage.setItem(associationKey, JSON.stringify(associations));
                localStorage.setItem(`${memberPrefix}${association.id}`, JSON.stringify(members));
                loadAssociations();
            }
        }
    }

    function navigateToMembers(associationId) {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        const association = associations.find(a => a.id === associationId);
        const members = JSON.parse(localStorage.getItem(`${memberPrefix}${associationId}`)) || [];

        if (!association) {
            alert('Association not found.');
            return;
        }

        hideAllSections();
        updateBreadcrumb(`${association.name} > Members`);
        $('#members-section-title').text(`Members of ${association.name}`);
        $('#members-section').data('association-id', associationId).removeClass('hidden');
        $('#members-section').data('association-name', association.name).removeClass('hidden');
        loadMembers(members);
    }

    function editMember(id) {
        const associationId = $('#members-section').data('association-id');
        const associationName = $('#members-section').data('association-name');
        const membersKey = `${memberPrefix}${associationId}`;
        const members = JSON.parse(localStorage.getItem(membersKey)) || [];
        const member = members.find(m => m.id === id);

        if (!member) {
            alert('Member not found.');
            return;
        }
        $('#section-title').text(`${associationName}`);

        $('#member-id').val(member.id);
        $('#member-name').val(member.name);
        $('#member-admission').val(member.admission);
        $('#member-father').val(member.father);
        $('#member-address').val(member.address);
        $('#member-community').val(member.community);
        $('#member-gender').val(member.gender);
        $('#member-photo').val('');

        hideAllSections();
        updateBreadcrumb('Edit Member');
        $('#member-form-section').removeClass('hidden');
    }

function saveMember() {
    const id = $('#member-id').val();
    const associationId = $('#members-section').data('association-id');
    const name = $('#member-name').val().trim();
    const admission = $('#member-admission').val().trim();
    const father = $('#member-father').val().trim();
    const address = $('#member-address').val().trim();
    const community = $('#member-community').val();
    const gender = $('#member-gender').val();
    const photoFile = $('#member-photo')[0].files[0];

    const membersKey = `${memberPrefix}${associationId}`;
    const members = JSON.parse(localStorage.getItem(membersKey)) || [];

    // Validate mandatory fields
    if (!name || !admission || !community || !address || !gender) {
        alert('Name, Admission Number, Community, Address, and Gender are mandatory fields.');
        return;
    }

    // Check for duplicate admission number
    const duplicate = members.some(
        (m) => m.admission === admission && m.id !== id
    );
    if (duplicate) {
        alert('Admission Number must be unique.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const photo = e.target.result;

        if (id) {
            const index = members.findIndex((m) => m.id === id);
            if (index !== -1) {
                members[index] = {
                    id,
                    name,
                    admission,
                    father,
                    address,
                    community,
                    gender,
                    photo,
                };
            } else {
                alert('Member not found. Please refresh the list.');
                return;
            }
        } else {
            members.push({
                id: new Date().getTime().toString(),
                name,
                admission,
                father,
                address,
                community,
                gender,
                photo,
            });
        }

        localStorage.setItem(membersKey, JSON.stringify(members));
        loadMembers(members);
        hideAllSections();
        $('#members-section').removeClass('hidden');        
    };

    if (photoFile) {
        reader.readAsDataURL(photoFile);
    } else {
        saveWithoutPhoto();
    }

    function saveWithoutPhoto() {
        if (id) {
            const index = members.findIndex((m) => m.id === id);
            if (index !== -1) {
                members[index] = {
                    id,
                    name,
                    admission,
                    father,
                    address,
                    community,
                    gender,
                };
            } else {
                alert('Member not found. Please refresh the list.');
                return;
            }
        } else {
            members.push({
                id: new Date().getTime().toString(),
                name,
                admission,
                father,
                address,
                community,
                gender,
            });
        }

        localStorage.setItem(membersKey, JSON.stringify(members));
        loadMembers(members);
        hideAllSections();
        $('#members-section').removeClass('hidden');        
    }
    updateBreadcrumb('');
}


    function deleteMember(id) {
        const associationId = $('#members-section').data('association-id');
        const membersKey = `${memberPrefix}${associationId}`;
        let members = JSON.parse(localStorage.getItem(membersKey)) || [];

        members = members.filter(m => m.id !== id);
        localStorage.setItem(membersKey, JSON.stringify(members));
        loadMembers(members);
    }

    // Load members and render them in the list
    function loadMembers(members) {
        $('#members-list').empty();

        members.forEach((member) => {
            const photo = member.photo || './assets/placeholder.png';
            $('#members-list').append(`
                <div class="member-card">
                    <div class="member-details">
                        <img src="${photo}" alt="${member.name}" class="member-thumbnail">
                        <div class="member-info">
                            <h3>${member.name}</h3>
                            <p><strong>Admission No:</strong> ${member.admission}</p>
                            <p><strong>Father's Name:</strong> ${member.father}</p>
                            <p><strong>Community:</strong> ${member.community}</p>
                            <p><strong>Gender:</strong> ${member.gender}</p>
                            <p><strong>Address:</strong> ${member.address}</p>
                        </div>
                    </div>
                    <div class="member-actions">
                        <button onclick="editMember('${member.id}')">Edit</button>
                        <button onclick="deleteMember('${member.id}')">Delete</button>
                    </div>
                </div>
            `);
        });
    }


    function clearMembersForm(){
        $('#member-id').val('');
        $('#member-name').val('');
        $('#member-admission').val('');
        $('#member-father').val('');
        $('#member-address').val('');
        $('#member-community').val('');
        $('#member-gender').val('');
        $('#member-photo').val('');
    }

        function generatePDF(associationId) {
            const associations = JSON.parse(localStorage.getItem('associations'));
            const association = associations.find((a) => a.id === associationId);
            let members = JSON.parse(
                localStorage.getItem(`members-${associationId}`)
            ) || [];

            // Sort members by admission number, and move no-photo entries to the end
            members = members.sort((a, b) => {
                if (!a.photo && b.photo) return 1;
                if (a.photo && !b.photo) return -1;
                return a.admission.localeCompare(b.admission);
            });

            const formattedDate = new Date().toLocaleDateString();

            // Placeholder image
            const placeholderImage =
                    'data:image/png;base64,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';


            const generateMemberRows = () => {
                const rows = [];
                members.forEach((member, index, array) => {

                    if (index % 2 === 0 && index + 1 < array.length) {
                        // Member data with fallbacks
                        const admission = `Admn No:   ${member.admission || "-"}`;
                        const name = `Name:   ${member.name || "-"}`;
                        const fatherName = `Father's Name:   ${member.father || "-"}`;
                        const address = `Address:   ${member.address || "-"}`;
                        const community = `Community:   ${member.community || "-"}`;
                        const gender = `Gender:   ${member.gender || "-"}`;
                        const photo1 = array[index].photo || placeholderImage;
                        const photo2 = array[index+1].photo || placeholderImage;

                        // Add each member as a formatted table row
                        rows.push([
                            {  
                                text: [`${index + 1}. \n\n`, {text: 'Admission No.:   ', bold:true}, `${array[index].admission || "-"}\n`, {text: 'Name:   ', bold:true}, `${array[index].name || "-"}\n`, {text: 'Father\'s Name:   ', bold:true}, `${array[index].father || "-"}\n`, {text: 'Address:   ', bold:true}, `${array[index].address || "-"}\n`, {text: 'Community:   ', bold:true}, `${array[index].community || "-"}\n`, {text: 'Gender:   ', bold:true}, `${array[index].gender || "-"}\n`],
                                fontSize: 10,
                                alignment: "left",
                                margin: [5, 5, 5, 5],
                            },
                            {
                                image: photo1,
                                fit: [70, 70],
                                alignment: "center",
                                margin: [5, 5, 5, 5],
                            },
                            {  
                                text: [`${index + 2}. \n\n`, {text: 'Admission No.:   ', bold:true}, `${array[index + 1].admission || "-"}\n`, {text: 'Name:   ', bold:true}, `${array[index + 1].name || "-"}\n`, {text: 'Father\'s Name:   ', bold:true}, `${array[index + 1].father || "-"}\n`, {text: 'Address:   ', bold:true}, `${array[index + 1].address || "-"}\n`, {text: 'Community:   ', bold:true}, `${array[index + 1].community || "-"}\n`, {text: 'Gender:   ', bold:true}, `${array[index + 1].gender || "-"}\n`],
                                fontSize: 10,
                                alignment: "left",
                                margin: [5, 5, 5, 5],
                            },
                            {
                                image: photo2,
                                fit: [70, 70],
                                alignment: "center",
                                margin: [5, 5, 5, 5],
                            },                        
                        ]);
                     }   
                    });

                return rows;
            };

            const pageHeader = [
                { text: association.name.toUpperCase(), alignment: 'center', bold: true, fontSize: 16 },
                { text: `Regd. No: ${association.reg}`, alignment: 'center', fontSize: 12 },
                { text: association.address.toUpperCase(), alignment: 'center', fontSize: 12 },
                { text: `LIST OF MEMBERS ELIGIBLE TO VOTE: ${formattedDate.toUpperCase()}`, alignment: 'center', bold: true, fontSize: 12, margin: [0, 10, 0, 10] },
            ];

            const rowsPerPage = 6;
            const memberRows = generateMemberRows();
            const tableRows = [];
            for (let i = 0; i < memberRows.length; i += rowsPerPage) {
                tableRows.push({
                    table: {
                        widths: ["35%", "15%", "35%", "15%"],
                        body: memberRows.slice(i, i + rowsPerPage),
                    },
                    pageBreak: i + rowsPerPage < memberRows.length ? "after" : undefined,
                });
            }

            const content = [
                ...pageHeader,
                tableRows
            ];

            pdfMake.createPdf({
                pageSize: "A4",
                content,
                pageMargins: [20, 40, 20, 40],
                styles: {
                    header: { fontSize: 14, bold: true },
                    subheader: { fontSize: 12, bold: true },
                    small: { fontSize: 10 },
                },
            }).download(`Voter List - ${association.name}.pdf`);
        }


        

    window.editAssociation = editAssociation;
    window.saveAssociation = saveAssociation;
    window.deleteAssociation = deleteAssociation;
    window.exportAllAssociations = exportAllAssociations;
    window.importAllAssociations = importAllAssociations;
    window.navigateToMembers = navigateToMembers;
    window.editMember = editMember;
    window.saveMember = saveMember;
    window.deleteMember = deleteMember;
    window.generatePDF = generatePDF;
    window.loadMembers = loadMembers;      

    initializeData();

    $('#add-association-btn').click(() => {
        hideAllSections();
        updateBreadcrumb('Add Association');
        clearAssociationForm();
        $('#association-form-section').removeClass('hidden');
    });

    $('#save-association').click(saveAssociation);

    $('#cancel-association').click(() => {
        hideAllSections();
        $('#associations-section').removeClass('hidden');
        updateBreadcrumb('');
    });

    $('#export-all-btn').click(exportAllAssociations);

    $('#import-all-btn').click(() => {
        $('#import-all-file').click();
    });

    $('#import-all-file').change(function () {
        const file = this.files[0];
        importAllAssociations(file);
    });

    $('#back-to-associations').click(() => {
        hideAllSections();
        $('#associations-section').removeClass('hidden');
        updateBreadcrumb('');
    });   

    $('#add-member-btn').click(() => {
        hideAllSections();
        updateBreadcrumb('Add Member');
        const associationName = $('#members-section').data('association-name');
        $('#section-title').text(`${associationName}`);
        clearMembersForm();
        $('#member-form-section').removeClass('hidden');
    });

    $('#save-member').click(saveMember);
    $('#cancel-member').click(() => {
        hideAllSections();
        $('#members-section').removeClass('hidden');
        updateBreadcrumb('');
    });

    $('#back-to-members').click(() => {
        hideAllSections();
         $('#members-section').removeClass('hidden');
        updateBreadcrumb('');
    });       
});